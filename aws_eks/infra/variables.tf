variable "team_name" {
  description = "team_name"
  type = string
  default = "default_team"
}

variable "aws_region" {
  description = "배포할 AWS 리전"
  type        = string
  default     = "ap-northeast-2"
}

variable "aws_access_key" {
  description   = "aws access key"
  type          = string
  nullable      = false
  sensitive     = true
}

variable "aws_secret_key" {
  description   = "aws secret key"
  type          = string
  nullable      = false
  sensitive     = true
}
