#!/usr/bin/env bash
set -euo pipefail

REPO="${REPO:-BBAK-jun/mountain-race-workspace}"

pr_status() {
  local pr="$1"
  gh pr view "$pr" --repo "$REPO" \
    --json title,mergeable,mergeStateStatus,reviewDecision,headRefName,baseRefName,files,commits
  gh pr checks "$pr" --repo "$REPO" || true
}

pr_diff() {
  local pr="$1"
  gh pr diff "$pr" --repo "$REPO"
}

pr_comment() {
  local pr="$1"
  local message="$2"
  gh pr comment "$pr" --repo "$REPO" --body "$message"
}

pr_request_changes() {
  local pr="$1"
  local message="$2"
  gh pr review "$pr" --repo "$REPO" --request-changes --body "$message"
}

pr_approve() {
  local pr="$1"
  local message="${2:-LGTM. 머지 진행 가능합니다.}"
  gh pr review "$pr" --repo "$REPO" --approve --body "$message"
}

docs_commit_push() {
  local message="$1"
  shift

  if [ "$#" -eq 0 ]; then
    echo "docs_commit_push: 커밋할 파일 경로를 1개 이상 넘겨주세요." >&2
    return 1
  fi

  git add "$@"

  if git diff --cached --quiet; then
    echo "스테이징된 변경이 없습니다."
    return 0
  fi

  git commit -m "$message"

  if ! git push origin main; then
    git fetch origin main
    git rebase origin/main
    git push origin main
  fi

  git status --short --branch
}

issue_update() {
  local issue="$1"
  local message="$2"
  gh issue comment "$issue" --repo "$REPO" --body "$message"
}

show_usage() {
  cat <<'EOF'
사용법:
  source scripts/pr-ops.sh

함수:
  pr_status <pr번호>
  pr_diff <pr번호>
  pr_comment <pr번호> "<메시지>"
  pr_request_changes <pr번호> "<메시지>"
  pr_approve <pr번호> ["<메시지>"]
  docs_commit_push "<커밋메시지>" <파일1> [파일2...]
  issue_update <issue번호> "<메시지>"

예시:
  pr_status 5
  pr_approve 5 "validate green 확인, 머지 가능합니다."
  issue_update 7 "업데이트: PR #5 머지 완료"
EOF
}
