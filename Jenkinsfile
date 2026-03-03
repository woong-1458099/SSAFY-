pipeline {
      agent any

      tools {
          // Jenkins Global Tool Configuration에 등록된 이름과 동일해야 함
          jdk 'jdk25'
      }

      options {
          timestamps()
      }

      stages {
          stage('Checkout') {
              steps {
                  checkout scm
              }
          }

          stage('Backend Test') {
              steps {
                  dir('BackEnd') {
                      bat 'gradlew.bat clean test'
                  }
              }
          }

          stage('Backend Build') {
              steps {
                  dir('BackEnd') {
                      bat 'gradlew.bat bootJar'
                  }
              }
          }
      }

      post {
          always {
              archiveArtifacts artifacts: 'BackEnd/build/libs/*.jar', allowEmptyArchive: true
          }
      }
  }