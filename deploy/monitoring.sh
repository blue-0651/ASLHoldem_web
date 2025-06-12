#!/bin/bash

# ASL Holdem 서버 모니터링 스크립트
# 시스템 상태, 서비스 상태, 리소스 사용량 등을 모니터링

set -e

# 색상 정의
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# 프로젝트 설정
PROJECT_NAME="asl_holdem"
PROJECT_DIR="/var/www/$PROJECT_NAME"

log_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

log_section() {
    echo -e "${BLUE}[SECTION]${NC} $1"
    echo "============================================"
}

# 시스템 정보 출력
show_system_info() {
    log_section "시스템 정보"
    
    echo "🖥️  서버 정보:"
    echo "- 호스트명: $(hostname)"
    echo "- 운영체제: $(lsb_release -d | cut -f2)"
    echo "- 커널: $(uname -r)"
    echo "- 아키텍처: $(uname -m)"
    echo "- 현재 시간: $(date)"
    echo "- 가동 시간: $(uptime -p)"
    echo "- 로드 평균: $(uptime | awk -F'load average:' '{ print $2 }')"
    echo ""
}

# 리소스 사용량 확인
check_resources() {
    log_section "리소스 사용량"
    
    # CPU 사용량
    echo "💾 CPU 사용량:"
    top -bn1 | grep "Cpu(s)" | awk '{print "- 사용률: " $2}' | sed 's/%us,//'
    echo ""
    
    # 메모리 사용량
    echo "🧠 메모리 사용량:"
    free -h | awk 'NR==2{printf "- 전체: %s, 사용: %s (%s), 여유: %s (%s)\n", $2, $3, $3/$2*100"%", $7, $7/$2*100"%"}'
    echo ""
    
    # 디스크 사용량
    echo "💿 디스크 사용량:"
    df -h | grep -vE '^Filesystem|tmpfs|cdrom' | awk '{print "- " $1 ": " $3 "/" $2 " (" $5 " 사용)"}'
    echo ""
    
    # 네트워크 연결
    echo "🌐 네트워크 연결:"
    ss -tuln | grep LISTEN | awk '{print "- " $1 " " $5}' | sort | uniq
    echo ""
}

# 서비스 상태 확인
check_services() {
    log_section "서비스 상태"
    
    # Django 서비스 (Supervisor)
    echo "🐍 Django 서비스:"
    if systemctl is-active --quiet supervisor; then
        if sudo supervisorctl status $PROJECT_NAME | grep -q "RUNNING"; then
            log_info "✅ Django 서비스가 정상 실행 중입니다."
            # PID와 메모리 사용량 확인
            local django_pid=$(sudo supervisorctl status $PROJECT_NAME | awk '{print $4}' | cut -d',' -f1)
            if [ ! -z "$django_pid" ]; then
                echo "   - PID: $django_pid"
                local mem_usage=$(ps -p $django_pid -o %mem --no-headers 2>/dev/null || echo "N/A")
                echo "   - 메모리 사용률: ${mem_usage}%"
            fi
        else
            log_error "❌ Django 서비스에 문제가 있습니다."
            sudo supervisorctl status $PROJECT_NAME
        fi
    else
        log_error "❌ Supervisor 서비스가 실행되지 않고 있습니다."
    fi
    echo ""
    
    # Nginx 서비스
    echo "🌐 Nginx 서비스:"
    if systemctl is-active --quiet nginx; then
        log_info "✅ Nginx가 정상 실행 중입니다."
        echo "   - 상태: $(systemctl is-active nginx)"
        echo "   - 마지막 시작: $(systemctl show nginx --property=ActiveEnterTimestamp --value)"
    else
        log_error "❌ Nginx 서비스에 문제가 있습니다."
        systemctl status nginx --no-pager
    fi
    echo ""
    
    # PostgreSQL 서비스
    echo "🗄️  PostgreSQL 서비스:"
    if systemctl is-active --quiet postgresql; then
        log_info "✅ PostgreSQL이 정상 실행 중입니다."
        echo "   - 상태: $(systemctl is-active postgresql)"
        # 데이터베이스 연결 테스트
        if sudo -u postgres psql -c "SELECT version();" >/dev/null 2>&1; then
            log_info "   - 데이터베이스 연결 성공"
        else
            log_warn "   - 데이터베이스 연결 테스트 실패"
        fi
    else
        log_error "❌ PostgreSQL 서비스에 문제가 있습니다."
        systemctl status postgresql --no-pager
    fi
    echo ""
}

# 포트 상태 확인
check_ports() {
    log_section "포트 상태"
    
    echo "🔌 주요 포트 확인:"
    
    # 포트 80 (HTTP)
    if netstat -tlnp 2>/dev/null | grep -q ":80.*LISTEN"; then
        log_info "✅ 포트 80 (HTTP)이 열려있습니다."
    else
        log_warn "⚠️  포트 80 (HTTP)이 열려있지 않습니다."
    fi
    
    # 포트 443 (HTTPS)
    if netstat -tlnp 2>/dev/null | grep -q ":443.*LISTEN"; then
        log_info "✅ 포트 443 (HTTPS)이 열려있습니다."
    else
        log_warn "⚠️  포트 443 (HTTPS)이 열려있지 않습니다."
    fi
    
    # 포트 8000 (Django)
    if netstat -tlnp 2>/dev/null | grep -q ":8000.*LISTEN"; then
        log_info "✅ 포트 8000 (Django)이 열려있습니다."
    else
        log_warn "⚠️  포트 8000 (Django)이 열려있지 않습니다."
    fi
    
    # 포트 5432 (PostgreSQL)
    if netstat -tlnp 2>/dev/null | grep -q ":5432.*LISTEN"; then
        log_info "✅ 포트 5432 (PostgreSQL)이 열려있습니다."
    else
        log_warn "⚠️  포트 5432 (PostgreSQL)이 열려있지 않습니다."
    fi
    echo ""
}

# 로그 파일 크기 확인
check_logs() {
    log_section "로그 파일 상태"
    
    echo "📝 로그 파일 크기:"
    
    # Django 로그
    if [ -f "$PROJECT_DIR/logs/supervisor.log" ]; then
        local log_size=$(du -h "$PROJECT_DIR/logs/supervisor.log" | cut -f1)
        echo "- Django 로그: $log_size"
    else
        echo "- Django 로그: 파일 없음"
    fi
    
    # Gunicorn 로그
    if [ -f "$PROJECT_DIR/logs/gunicorn_error.log" ]; then
        local error_log_size=$(du -h "$PROJECT_DIR/logs/gunicorn_error.log" | cut -f1)
        echo "- Gunicorn 에러 로그: $error_log_size"
    else
        echo "- Gunicorn 에러 로그: 파일 없음"
    fi
    
    # Nginx 로그
    if [ -f "/var/log/nginx/error.log" ]; then
        local nginx_error_size=$(du -h "/var/log/nginx/error.log" | cut -f1)
        echo "- Nginx 에러 로그: $nginx_error_size"
    else
        echo "- Nginx 에러 로그: 파일 없음"
    fi
    
    # 최근 에러 확인
    echo ""
    echo "📋 최근 에러 (최근 24시간):"
    local error_count=0
    
    # Django 에러 확인
    if [ -f "$PROJECT_DIR/logs/supervisor.log" ]; then
        local django_errors=$(grep -i "error\|exception\|traceback" "$PROJECT_DIR/logs/supervisor.log" | tail -5 | wc -l)
        if [ $django_errors -gt 0 ]; then
            echo "- Django 에러: $django_errors 건"
            error_count=$((error_count + django_errors))
        fi
    fi
    
    # Nginx 에러 확인
    if [ -f "/var/log/nginx/error.log" ]; then
        local nginx_errors=$(grep "$(date '+%Y/%m/%d')" "/var/log/nginx/error.log" | wc -l)
        if [ $nginx_errors -gt 0 ]; then
            echo "- Nginx 에러: $nginx_errors 건"
            error_count=$((error_count + nginx_errors))
        fi
    fi
    
    if [ $error_count -eq 0 ]; then
        log_info "✅ 최근 24시간 내 에러가 없습니다."
    else
        log_warn "⚠️  최근 24시간 내 $error_count 건의 에러가 발견되었습니다."
    fi
    echo ""
}

# SSL 인증서 확인
check_ssl() {
    log_section "SSL 인증서 상태"
    
    # Let's Encrypt 인증서 확인
    local cert_dirs=$(find /etc/letsencrypt/live -maxdepth 1 -type d -name "*.com" 2>/dev/null || true)
    
    if [ -n "$cert_dirs" ]; then
        echo "🔒 SSL 인증서:"
        for cert_dir in $cert_dirs; do
            local domain=$(basename "$cert_dir")
            local cert_file="$cert_dir/fullchain.pem"
            
            if [ -f "$cert_file" ]; then
                local expiry_date=$(openssl x509 -enddate -noout -in "$cert_file" 2>/dev/null | cut -d= -f2)
                local days_left=$(( ($(date -d "$expiry_date" +%s) - $(date +%s)) / 86400 ))
                
                echo "- 도메인: $domain"
                echo "  만료일: $expiry_date"
                
                if [ $days_left -gt 30 ]; then
                    log_info "  상태: ✅ 정상 ($days_left일 남음)"
                elif [ $days_left -gt 7 ]; then
                    log_warn "  상태: ⚠️  곧 만료 ($days_left일 남음)"
                else
                    log_error "  상태: ❌ 긴급 갱신 필요 ($days_left일 남음)"
                fi
            fi
        done
    else
        log_warn "⚠️  SSL 인증서가 설치되지 않았습니다."
    fi
    echo ""
}

# 보안 상태 확인
check_security() {
    log_section "보안 상태"
    
    echo "🔐 보안 설정:"
    
    # 방화벽 상태
    if command -v ufw >/dev/null 2>&1; then
        local ufw_status=$(sudo ufw status | grep "Status:" | cut -d: -f2 | tr -d ' ')
        if [ "$ufw_status" = "active" ]; then
            log_info "✅ 방화벽이 활성화되어 있습니다."
        else
            log_warn "⚠️  방화벽이 비활성화되어 있습니다."
        fi
    fi
    
    # SSH 설정 확인
    if [ -f "/etc/ssh/sshd_config" ]; then
        local root_login=$(grep "^PermitRootLogin" /etc/ssh/sshd_config | awk '{print $2}')
        local password_auth=$(grep "^PasswordAuthentication" /etc/ssh/sshd_config | awk '{print $2}')
        
        echo "- SSH 루트 로그인: ${root_login:-기본값}"
        echo "- SSH 비밀번호 인증: ${password_auth:-기본값}"
    fi
    
    # 최근 로그인 시도
    echo ""
    echo "👤 최근 로그인 시도 (최근 10개):"
    last -n 10 | head -10
    echo ""
}

# 전체 상태 요약
show_summary() {
    log_section "시스템 상태 요약"
    
    echo "📊 전체 상태:"
    
    # 각 서비스 상태 요약
    local services_ok=0
    local total_services=3
    
    # Django
    if sudo supervisorctl status $PROJECT_NAME 2>/dev/null | grep -q "RUNNING"; then
        services_ok=$((services_ok + 1))
    fi
    
    # Nginx
    if systemctl is-active --quiet nginx; then
        services_ok=$((services_ok + 1))
    fi
    
    # PostgreSQL
    if systemctl is-active --quiet postgresql; then
        services_ok=$((services_ok + 1))
    fi
    
    echo "- 서비스 상태: $services_ok/$total_services 정상"
    
    # 메모리 사용률
    local mem_usage=$(free | grep Mem | awk '{printf("%.1f", $3/$2 * 100.0)}')
    echo "- 메모리 사용률: ${mem_usage}%"
    
    # 디스크 사용률 (루트 파티션)
    local disk_usage=$(df / | tail -1 | awk '{print $5}' | sed 's/%//')
    echo "- 디스크 사용률: ${disk_usage}%"
    
    # 로드 평균
    local load_avg=$(uptime | awk -F'load average:' '{print $2}' | awk '{print $1}' | sed 's/,//')
    echo "- 로드 평균: $load_avg"
    
    echo ""
    
    # 권장사항
    if [ $services_ok -lt $total_services ]; then
        log_warn "⚠️  일부 서비스에 문제가 있습니다. 위의 상세 정보를 확인하세요."
    fi
    
    if (( $(echo "$mem_usage > 80" | bc -l) )); then
        log_warn "⚠️  메모리 사용률이 높습니다 (${mem_usage}%). 서비스 재시작을 고려하세요."
    fi
    
    if [ $disk_usage -gt 85 ]; then
        log_warn "⚠️  디스크 사용률이 높습니다 (${disk_usage}%). 로그 정리나 백업을 고려하세요."
    fi
    
    if [ $services_ok -eq $total_services ] && (( $(echo "$mem_usage < 80" | bc -l) )) && [ $disk_usage -lt 85 ]; then
        log_info "✅ 시스템이 정상적으로 운영되고 있습니다!"
    fi
}

# 메인 실행 함수
main() {
    clear
    echo "🔍 ASL Holdem 서버 모니터링 리포트"
    echo "생성 시간: $(date)"
    echo "=============================================="
    echo ""
    
    show_system_info
    check_resources
    check_services
    check_ports
    check_logs
    check_ssl
    check_security
    show_summary
    
    echo "=============================================="
    echo "모니터링 완료! 문제가 있는 경우 관련 로그를 확인하세요."
}

# 사용법
usage() {
    echo "사용법: $0 [옵션]"
    echo ""
    echo "옵션:"
    echo "  -h, --help       이 도움말 출력"
    echo "  -s, --summary    요약 정보만 출력"
    echo "  -q, --quick      빠른 상태 확인"
    echo "  -l, --logs       로그 정보만 출력"
    echo ""
}

# 인자 처리
case "${1:-}" in
    -h|--help)
        usage
        exit 0
        ;;
    -s|--summary)
        show_summary
        ;;
    -q|--quick)
        check_services
        check_ports
        ;;
    -l|--logs)
        check_logs
        ;;
    "")
        main
        ;;
    *)
        echo "알 수 없는 옵션: $1"
        usage
        exit 1
        ;;
esac 