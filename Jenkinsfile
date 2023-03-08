pipeline {
  agent any
  // agent { <-- this allows us to run the pipeline inside a Docker container
  //   docker {
  //     image 'node:16.13.1-alpine'
  //   }
  // }
  // tools {
  //   docker '<version>' // <-- should be configured under `Manage Jenkins → Global Tool Configuration`
  // }
  triggers {
    githubPush()
  }
  environment {
    // TAG_NAME = sh(returnStdout: true, script: "git --no-pager tag --points-at HEAD").trim()
    TAG_NAME = sh(returnStdout: true, script: "git describe --tags --abbrev=0").trim()
    DH_CREDS=credentials('DH_CREDS')
    // SSH_CREDS=credentials('SSH_CREDS')
  }
  stages {
    stage('Build image and tag it') {
      when { buildingTag() }
      steps {
        sh'''
          echo "building tag ${TAG_NAME}"
          docker build . -t portal:${TAG_NAME}
          docker tag portal:${TAG_NAME} wishai/portal:${TAG_NAME}
        '''
      }
    }
    stage('Push image to DockerHub') {
      when { buildingTag() }
      steps {
        sh'''
          echo $DH_CREDS_PSW | docker login --username=${DH_CREDS_USR} --password-stdin
          docker push wishai/portal:${TAG_NAME}
        '''
      }
      post {
        always {
          sh 'docker logout'
        }
      }
    }
    stage('Update docker image in production server') {
      when { buildingTag() }

      steps {
        script {
          updateServerCommand = "whoami && \
              docker ps"
        }

        sshagent(credentials: ['SSH_CREDS']) {
          sh "ssh -o StrictHostKeyChecking=no root@quizz.co.il '${updateServerCommand}' "
        }
      }
    }
  }
  post {
    failure {
      steps {
        // [TODO] send email or something...
        echo 'Failed!'
      }
    }
  }
}
