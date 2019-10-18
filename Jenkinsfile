pipeline {
  agent {
    docker {
      image 'node:8-alpine'
      args '-p 3000:3000'
    }

  }
  stages {
    stage('Install Packages') {
      steps {
        sh 'npm install'
      }
    }
    stage('Build') {
      steps {
        sh 'npm run build'
      }
    }
    stage('Deploy to S3') {
      steps {
        s3Upload(bucket: 'matic-jenkins-dev', cacheControl: 'public,max-age=31536000', workingDir: 'dist')
      }
    }
  }
}