#!/bin/bash

# 가상 환경을 생성할 디렉터리 이름
VENV_DIR="ansible_venv"

# 스크립트 실행 중 오류가 발생하면 즉시 중단
set -e

echo "🐍 Python 가상 환경 생성을 시작합니다..."

if ! command -v python3 &> /dev/null
then
    echo "오류: python3를 찾을 수 없습니다. Python 3를 먼저 설치해주세요."
    exit 1
fi

if ! python3 -c "import venv" &> /dev/null
then
    echo "오류: python3-venv 모듈이 없습니다. 'sudo apt-get install python3-venv' 명령어로 설치해주세요."
    exit 1
fi


if [ -d "$VENV_DIR" ]; then
    echo "이미 '${VENV_DIR}' 디렉터리가 존재합니다. 기존 환경을 사용합니다."
else
    python3 -m venv "$VENV_DIR"
    echo "'${VENV_DIR}' 가상 환경을 성공적으로 생성했습니다."
fi

echo "가상 환경을 활성화합니다."
source "${VENV_DIR}/bin/activate"


echo " Ansible과 AWS 라이브러리(boto3, botocore)를 설치합니다..."
pip install ansible boto3 botocore

echo ""
echo " 설치가 완료되었습니다!"
echo ""
echo "✅ 가상 환경을 사용하려면 아래 명령어를 실행하세요:"
echo '--------------------------------------------'
echo "source ${VENV_DIR}/bin/activate"
echo '--------------------------------------------'
echo ""
echo "✅ ansible playbook 실행"
echo '--------------------------------------------'
echo "ansible-playbook -i inventory.ini deploy.yml"
echo '--------------------------------------------'
echo ""
echo "비활성화하려면 'deactivate' 명령어를 입력하세요."
