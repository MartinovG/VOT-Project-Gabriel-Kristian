pipeline {
    agent any

    environment {
        // Defines parameters for docker hub 
        DOCKERHUB_CREDENTIALS = 'dockerhub-credentials'
        DOCKERHUB_USERNAME = 'your_username' // Change to your actual user
        IMAGE_NAME = "vot-project-gabriel-kristian"
        IMAGE_TAG = "${env.BUILD_NUMBER}"
        WEBHOOK_URL = credentials('slack-webhook-url') // Jenkins credential injected here
        NODE_ENV = 'production'
    }

    stages {
        stage('Checkout') {
            steps {
                script {
                    echo "Checking out Git Repository"
                }
                checkout scm
            }
        }

        stage('Install Dependencies') {
            steps {
                script {
                    echo "Installing NPM dependencies"
                }
                sh 'npm ci'
            }
        }

        stage('Lint & Security Checks') {
            steps {
                script {
                    echo "Running ESLint"
                }
                sh 'npm run lint'
                
                script {
                    echo "Running SecretLint"
                }
                sh 'npm run secretlint'
            }
        }

        stage('Run Tests') {
            steps {
                script {
                    echo "Running Unit Tests with Supertest"
                }
                sh 'npm run test'
            }
            post {
                success {
                    script {
                        def msg = "✅ *Tests & Linting Passed successfully for Build #${env.BUILD_NUMBER}!*"
                        sh "curl -X POST -H 'Content-type: application/json' --data '{\"text\":\"${msg}\"}' ${env.WEBHOOK_URL}"
                    }
                }
                failure {
                    script {
                        def msg = "❌ *Tests or Linting FAILED for Build #${env.BUILD_NUMBER}!*"
                        sh "curl -X POST -H 'Content-type: application/json' --data '{\"text\":\"${msg}\"}' ${env.WEBHOOK_URL}"
                    }
                }
            }
        }

        stage('Build Docker Image') {
            steps {
                script {
                    echo "Building Docker image"
                }
                sh "docker build -t ${DOCKERHUB_USERNAME}/${IMAGE_NAME}:${IMAGE_TAG} -t ${DOCKERHUB_USERNAME}/${IMAGE_NAME}:latest ."
            }
        }

        stage('Push to Docker Hub') {
            steps {
                script {
                    echo "Pushing image to Docker Hub"
                }
                withCredentials([usernamePassword(credentialsId: "${DOCKERHUB_CREDENTIALS}", passwordVariable: 'DOCKERHUB_PASS', usernameVariable: 'DOCKERHUB_USER')]) {
                    sh "echo \$DOCKERHUB_PASS | docker login -u \$DOCKERHUB_USER --password-stdin"
                    sh "docker push ${DOCKERHUB_USERNAME}/${IMAGE_NAME}:${IMAGE_TAG}"
                    sh "docker push ${DOCKERHUB_USERNAME}/${IMAGE_NAME}:latest"
                }
            }
            post {
                success {
                    script {
                        def msg = "🚀 *New Docker Image Pushed to Docker Hub!*\nImage: `${DOCKERHUB_USERNAME}/${IMAGE_NAME}:${IMAGE_TAG}`"
                        sh "curl -X POST -H 'Content-type: application/json' --data '{\"text\":\"${msg}\"}' ${env.WEBHOOK_URL}"
                    }
                }
            }
        }
    }

    post {
        always {
            script {
                echo "Cleaning up workspace"
            }
            cleanWs()
            sh "docker logout"
        }
    }
}
