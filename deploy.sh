#!/usr/bin/env bash
# ==============================================================================
# Builds the Docker image locally and deploys it to a remote Docker context.
#
# Usage:
#   ./deploy.sh                # Deploys using default context 'vps'
#   ./deploy.sh <context-name> # Deploys using specified context (e.g. ./deploy.sh staging)
#   ./deploy.sh --seed         # Deploys and runs the initial database seed tool
# ==============================================================================

set -euo pipefail

# Default configuration
DEFAULT_CONTEXT="vps"
TARGET_PLATFORM="${PLATFORM:-linux/amd64}"
IMAGE_NAME="dailies:latest"
RUN_SEED=false

# ANSI colors for readable output
BOLD='\033[1m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[0;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

print_help() {
  echo -e "${BOLD}Usage:${NC}"
  echo "  ./deploy.sh [CONTEXT_NAME] [OPTIONS]"
  echo ""
  echo -e "${BOLD}Arguments:${NC}"
  echo "  CONTEXT_NAME          Docker context name to deploy to (default: 'vps')"
  echo ""
  echo -e "${BOLD}Options:${NC}"
  echo "  -s, --seed            Run the seed tool after deployment (creates default admin & templates)"
  echo "  -p, --platform ARCH   Target CPU architecture (default: 'linux/amd64')"
  echo "  -h, --help            Show this help message"
  echo ""
  echo -e "${BOLD}Examples:${NC}"
  echo "  ./deploy.sh                    # Deploy to default context 'vps'"
  echo "  ./deploy.sh production         # Deploy to context 'production'"
  echo "  ./deploy.sh vps --seed         # Deploy and seed database"
  echo "  ./deploy.sh --platform arm64   # Deploy to an ARM64 VPS (e.g. Oracle/Hetzner ARM)"
}

# Parse arguments
CONTEXT=""
while [[ $# -gt 0 ]]; do
  case "$1" in
    -h|--help)
      print_help
      exit 0
      ;;
    -s|--seed)
      RUN_SEED=true
      shift
      ;;
    -p|--platform)
      TARGET_PLATFORM="$2"
      shift 2
      ;;
    -*)
      echo -e "${RED}Unknown option: $1${NC}"
      print_help
      exit 1
      ;;
    *)
      if [[ -z "$CONTEXT" ]]; then
        CONTEXT="$1"
      else
        echo -e "${RED}Unexpected extra argument: $1${NC}"
        print_help
        exit 1
      fi
      shift
      ;;
  esac
done

CONTEXT="${CONTEXT:-$DEFAULT_CONTEXT}"

echo -e "${BLUE}${BOLD}======================================================${NC}"
echo -e "${BLUE}${BOLD}  Deployment${NC}"
echo -e "${BLUE}${BOLD}  Context:  ${GREEN}${CONTEXT}${NC}"
echo -e "${BLUE}${BOLD}  Platform: ${GREEN}${TARGET_PLATFORM}${NC}"
echo -e "${BLUE}${BOLD}======================================================${NC}"

# 1. Verify local Docker is running
if ! docker info >/dev/null 2>&1; then
  echo -e "${RED}Error: Docker is not running locally. Please start Docker Desktop or the Docker daemon.${NC}"
  exit 1
fi

# 2. Check if the target Docker context exists
if ! docker context inspect "$CONTEXT" >/dev/null 2>&1; then
  echo -e "${RED}Error: Docker context '${CONTEXT}' does not exist.${NC}\n"
  echo -e "You can create it by running:"
  echo -e "  ${YELLOW}docker context create ${CONTEXT} --docker \"host=ssh://<user>@<vps-ip>\"${NC}\n"
  echo -e "Available Docker contexts on this machine:"
  docker context ls
  exit 1
fi

# 3. Build image locally with buildx for the target platform
echo -e "\n${BOLD}[1/4] Building image locally for ${TARGET_PLATFORM}...${NC}"
docker buildx build \
  --platform "$TARGET_PLATFORM" \
  -t "$IMAGE_NAME" \
  --load \
  .

# 4. Stream and load the image into the remote context
echo -e "\n${BOLD}[2/4] Transferring image to Docker context '${CONTEXT}'...${NC}"
docker save "$IMAGE_NAME" | gzip | docker --context "$CONTEXT" load

# 5. Start/restart container on the remote context
echo -e "\n${BOLD}[3/4] Deploying container on context '${CONTEXT}'...${NC}"
docker --context "$CONTEXT" compose up -d --no-build --remove-orphans

# 6. Optional: run database seeding
if [ "$RUN_SEED" = true ]; then
  echo -e "\n${BOLD}[Optional] Seeding initial game templates and admin user...${NC}"
  # Wait for container to be ready
  sleep 2
  docker --context "$CONTEXT" compose exec dailies /app/dailies-seed || true
fi

# 7. Check container status
echo -e "\n${BOLD}[4/4] Verifying deployment status...${NC}"
docker --context "$CONTEXT" compose ps

echo -e "\n${GREEN}${BOLD}✓ Deployment to '${CONTEXT}' completed successfully!${NC}"
