import React, { useEffect, useRef } from 'react';
import Phaser from 'phaser';

// 1. 페이저 씬(Scene) 정의
class MainScene extends Phaser.Scene {
  constructor() {
    super({ key: 'MainScene' });
  }

  preload() {
    // 여기에 이미지나 오디오 등 에셋을 로드합니다.
    // 예: this.load.image('logo', 'assets/logo.png');
  }

  create() {
    // 화면 중앙에 텍스트 추가
    const text = this.add.text(400, 300, 'React + Phaser 3\n게임이 시작되었습니다!', {
      fontFamily: 'Arial',
      fontSize: '32px',
      color: '#ffffff',
      align: 'center'
    });
    text.setOrigin(0.5, 0.5);

    // 텍스트가 위아래로 움직이는 간단한 애니메이션 추가
    this.tweens.add({
      targets: text,
      y: 280,
      duration: 1000,
      ease: 'Sine.inOut',
      yoyo: true,
      repeat: -1
    });
  }
  
  update() {
    // 매 프레임마다 실행될 게임 로직을 여기에 작성합니다.
  }
}

// 2. 리액트 컴포넌트 정의
const PhaserGame = () => {
  // 게임이 렌더링될 DOM 요소를 참조하기 위한 ref
  const gameRef = useRef(null);

  useEffect(() => {
    // 페이저 게임 설정
    const config = {
      type: Phaser.AUTO, // WebGL을 기본으로 하되 지원하지 않으면 Canvas 사용
      width: 800,
      height: 600,
      parent: gameRef.current, // ref가 가리키는 div 요소 안에 캔버스 생성
      backgroundColor: '#282c34',
      scene: [MainScene], // 위에서 만든 씬 배열
      physics: {
        default: 'arcade', // 기본 물리 엔진 설정
        arcade: {
          gravity: { y: 200 },
          debug: false
        }
      }
    };

    // 게임 인스턴스 생성
    const game = new Phaser.Game(config);

    // 컴포넌트가 언마운트될 때 게임 인스턴스를 파괴 (메모리 누수 방지)
    return () => {
      game.destroy(true);
    };
  }, []); // 빈 배열을 넣어 컴포넌트 마운트 시 한 번만 실행되도록 함

  return (
    <div style={styles.container}>
      <h1>내 첫 번째 리액트 게임 페이지</h1>
      {/* 이 div 안에 페이저 캔버스가 들어갑니다 */}
      <div ref={gameRef} style={styles.gameArea} />
    </div>
  );
};

// 간단한 스타일링
const styles = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '100vh',
    backgroundColor: '#1e1e1e',
    color: 'white'
  },
  gameArea: {
    border: '4px solid #61dafb',
    borderRadius: '8px',
    overflow: 'hidden',
    boxShadow: '0 4px 15px rgba(0,0,0,0.5)'
  }
};

export default PhaserGame;