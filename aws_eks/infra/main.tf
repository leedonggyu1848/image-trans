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
resource "aws_security_group" "bastion_outbound" {
  name   = "${var.team_name}-stateful-sg"
  vpc_id = module.vpc.vpc_id

  ingress {
    from_port   = 22
    to_port     = 22
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }
  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }
}

resource "aws_security_group" "bastion_inbound" {
  name   = "${var.team_name}-stateful-sg"
  vpc_id = module.vpc.vpc_id

  ingress {
    from_port       = 0
    to_port         = 0
    protocol        = "-1"
    cidr_blocks = [ module.vpc.vpc_cidr_block]
  }
  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = [ module.vpc.vpc_cidr_block]
  }
}

resource "aws_instance" "bastion" {
  ami           = "ami-00e73adb2e2c80366"
  instance_type = "t3.medium"
  subnet_id     = module.vpc.public_subnets[0]
  key_name      = aws_key_pair.main.key_name
  vpc_security_group_ids = [aws_security_group.bastion_inbound.id, aws_security_group.bastion_outbound.id]
  associate_public_ip_address = true

  tags = {
    Name      = "${var.team_name}-stateful"
  }
}

