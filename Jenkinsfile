pipeline {
  agent {
    node {
      label 'master'
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