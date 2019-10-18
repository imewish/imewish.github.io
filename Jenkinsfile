pipeline {
  agent {
    docker {
      image 'node:8-alpine'
      args '-p 3000:3000'
    }

  }
  stages {
    stage('deploy') {
      steps {
        s3Upload(bucket: 'matic-jenkins-dev', pathStyleAccessEnabled: true, payloadSigningEnabled: true, workingDir: '/', includePathPattern: '**/*')
      }
    }
  }
}