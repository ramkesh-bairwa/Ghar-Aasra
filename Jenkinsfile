pipeline {
    agent any

    environment {
        APP_NAME      = 'gharaasra'
        APP_DIR       = '/var/www/gharaasra'
        SERVICE       = 'flexhome'
        GIT_REPO      = 'https://github.com/ramkesh-bairwa/Ghar-Aasra.git'
        GIT_BRANCH    = 'main'
        COMPOSE_FILE  = 'docker-compose.yml'
        HEALTH_URL    = 'http://localhost:3000'
    }

    options {
        buildDiscarder(logRotator(numToKeepStr: '10'))
        timeout(time: 20, unit: 'MINUTES')
        disableConcurrentBuilds()
    }

    // Fires automatically when a merge/push lands on GIT_BRANCH.
    // Requires: GitHub plugin installed on Jenkins, a webhook on this repo
    // (Settings > Webhooks > Payload URL = https://<jenkins-host>/github-webhook/,
    // content type application/json, event = "just the push event"), and
    // "GitHub hook trigger for GITScm polling" checked in this job's config.
    triggers {
        githubPush()
    }

    stages {
        stage('Checkout') {
            steps {
                echo ">>> Pulling latest ${GIT_BRANCH} from Git..."
                git branch: "${GIT_BRANCH}",
                    url: "${GIT_REPO}",
                    credentialsId: 'github-credentials'
            }
        }

        stage('Sync to deploy directory') {
            steps {
                echo ">>> Syncing code to ${APP_DIR}..."
                sh '''
                    mkdir -p ${APP_DIR}
                    rsync -av --delete \
                        --exclude='.git' \
                        --exclude='node_modules' \
                        --exclude='.next' \
                        --exclude='.env' \
                        ./ ${APP_DIR}/
                '''
            }
        }

        stage('Install dependencies') {
            steps {
                echo '>>> Installing dependencies inside the app container...'
                sh '''
                    cd ${APP_DIR}
                    docker compose -f ${COMPOSE_FILE} build ${SERVICE}
                    docker compose -f ${COMPOSE_FILE} run --rm ${SERVICE} npm install
                '''
            }
        }

        stage('Deploy') {
            steps {
                echo '>>> Recreating containers...'
                sh '''
                    cd ${APP_DIR}
                    docker compose -f ${COMPOSE_FILE} up -d --remove-orphans --force-recreate ${SERVICE}
                '''
            }
        }

        stage('Health Check') {
            steps {
                echo '>>> Checking application health...'
                sh '''
                    for i in $(seq 1 10); do
                        sleep 3
                        curl -fs ${HEALTH_URL} > /dev/null && echo "Health check passed!" && exit 0
                    done
                    echo "Health check failed!"
                    exit 1
                '''
            }
        }

        stage('Cleanup old images') {
            steps {
                sh 'docker image prune -f'
            }
        }
    }

    post {
        success {
            echo '✅ Deployment successful!'
        }
        failure {
            echo '❌ Deployment failed!'
        }
        always {
            cleanWs()
        }
    }
}
