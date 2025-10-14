# ------------------------------------------------------------------------------
# 데이터 소스
# ------------------------------------------------------------------------------
data "aws_availability_zones" "available" {
  state = "available"
}

# ------------------------------------------------------------------------------
# SSH 키 페어
# ------------------------------------------------------------------------------
resource "tls_private_key" "aws_ssh_key" {
  algorithm = "RSA"
  rsa_bits  = 4096
}

resource "aws_key_pair" "main" {
  key_name   = "${var.team_name}-key"
  public_key = tls_private_key.aws_ssh_key.public_key_openssh
}

resource "local_file" "ssh_private_key" {
  content         = tls_private_key.aws_ssh_key.private_key_pem
  filename        = pathexpand("~/.ssh/${var.team_name}.pem")
  file_permission = "0400"
}

# ------------------------------------------------------------------------------
# 모듈: VPC
# ------------------------------------------------------------------------------
module "vpc" {
  source  = "terraform-aws-modules/vpc/aws"
  version = "~> 6.4"

  name = "${var.team_name}-vpc"
  cidr = "10.0.0.0/16"

  azs             = [data.aws_availability_zones.available.names[0], data.aws_availability_zones.available.names[1]]
  private_subnets = ["10.0.1.0/24", "10.0.2.0/24"]
  public_subnets  = ["10.0.101.0/24", "10.0.102.0/24"]

  enable_nat_gateway = true
  single_nat_gateway  = false
  one_nat_gateway_per_az = true
  enable_dns_hostnames = true

  tags = { "kubernetes.io/cluster/${var.team_name}-cluster" = "shared" }
  public_subnet_tags = { "kubernetes.io/role/elb" = "1" }
  private_subnet_tags = { "kubernetes.io/role/internal-elb" = "1" }
}

# ------------------------------------------------------------------------------
# 모듈: EKS
# ------------------------------------------------------------------------------

resource "aws_security_group" "eks" {
  name   = "${var.team_name}-eks-sg"
  vpc_id = module.vpc.vpc_id

  ingress {
    from_port       = 0
    to_port         = 0
    protocol        = "-1"
    cidr_blocks  = ["0.0.0.0/0"]
  }
  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }
}

module "eks" {
  source  = "terraform-aws-modules/eks/aws"
  version = "~> 21.0"

  name    = "${var.team_name}-cluster"
  kubernetes_version = "1.34"

  vpc_id     = module.vpc.vpc_id
  subnet_ids = module.vpc.private_subnets

  endpoint_public_access = true
  enable_cluster_creator_admin_permissions = true

  addons = {
    coredns                = {}
    eks-pod-identity-agent = {
      before_compute = true
    }
    kube-proxy             = {}
    vpc-cni                = {
      before_compute = true
    }
  }

  eks_managed_node_groups = {
    main = {
      name           = "${var.team_name}-node-group"
      instance_types = ["t3.medium"]
      min_size       = 2
      max_size       = 5
      desired_size   = 2
      vpc_security_group_ids = [aws_security_group.eks.id]
    }
  }
}

# ------------------------------------------------------------------------------
# ec2
# ------------------------------------------------------------------------------
resource "aws_security_group" "stateful" {
  name   = "${var.team_name}-stateful-sg"
  vpc_id = module.vpc.vpc_id
  ingress {
    protocol    = "tcp"
    from_port   = 22
    to_port     = 22
    cidr_blocks = ["0.0.0.0/0"]
    description = "Allow SSH access"
  }

  ingress {
    protocol    = "tcp"
    from_port   = 20000
    to_port     = 20100
    cidr_blocks = ["0.0.0.0/0"]
    description = "Allow custom application port range 20000-20100"
  }

  ingress {
    protocol    = "tcp"
    from_port   = 80
    to_port     = 80
    cidr_blocks = ["0.0.0.0/0"]
    description = "Allow HTTP traffic from anywhere"
  }

  ingress {
    protocol    = "tcp"
    from_port   = 443
    to_port     = 443
    cidr_blocks = ["0.0.0.0/0"]
    description = "Allow HTTPS traffic from anywhere"
  }

  ingress {
    protocol    = "-1"
    from_port   = 0
    to_port     = 0
    cidr_blocks = [module.vpc.vpc_cidr_block]
    description = "Allow all traffic from within the VPC"
  }

  egress {
    protocol    = "-1"
    from_port   = 0
    to_port     = 0
    cidr_blocks = ["0.0.0.0/0"]
    description = "Allow all outbound traffic"
  }
  tags = {
    Name = "${var.team_name}-stateful-sg"
  }
}

resource "aws_instance" "stateful" {
  ami           = "ami-00e73adb2e2c80366"
  instance_type = "t3.medium"
  subnet_id     = module.vpc.public_subnets[0]
  key_name      = aws_key_pair.main.key_name
  vpc_security_group_ids = [aws_security_group.stateful.id]
  associate_public_ip_address = true

  tags = {
    Name      = "${var.team_name}-stateful"
  }
}


# ------------------------------------------------------------------------------
# EBS
# ------------------------------------------------------------------------------

resource "aws_ebs_volume" "stateful_data" {
  availability_zone = aws_instance.stateful.availability_zone

  size = 20
  type = "gp3"

  tags = {
    Name = "${var.team_name}-stateful-data-volume"
  }
}

resource "aws_volume_attachment" "ebs_att" {
  device_name = "/dev/sdf"

  volume_id = aws_ebs_volume.stateful_data.id
  instance_id = aws_instance.stateful.id
}

resource "local_file" "ansible_inventory" {
  depends_on = [aws_instance.stateful, local_file.ssh_private_key]

  # 생성될 인벤토리 파일의 내용
  content = <<-EOT
    [ec2_servers]
    ${aws_instance.stateful.public_ip}

    [ec2_servers:vars]
    ansible_user=ubuntu
    ansible_ssh_private_key_file=${abspath(local_file.ssh_private_key.filename)}
  EOT

  # 파일 이름
  filename = "../ansible/inventory.ini"
}