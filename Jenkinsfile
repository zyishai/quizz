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
    DH_CREDS=credentials('DH_CREDS')
    // SSH_CREDS=credentials('SSH_CREDS')
  }
  stages {
    stage('Build image and tag it') {
      when { buildingTag() }
      steps {
        sh'''
          echo "building tag ${env.TAG_NAME}"
          // docker build . -t <docker_image>:<image_tag>
        '''
      }
    }
    stage('Push image to DockerHub') {
      when { buildingTag() }
      steps {
        sh'''
          echo $DH_CREDS_PSW | docker login --username=${DH_CREDS_USR} --password-stdin
          // docker push <docker_image>:<image_tag>
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
