terraform {
  required_version = ">= 1.3.0"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 6.0"
    }
    local = {
      source    = "hashicorp/local"
      version   = "2.5.3"
    }
  }
}

provider "aws" {
  region = var.aws_region
  access_key  = var.aws_access_key
  secret_key  = var.aws_secret_key
}
