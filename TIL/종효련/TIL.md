Unity 2D 핵심 개념 요약

1. 씬 (Scene)
개념: 게임의 '장면'이나 '스테이지' 단위
메인 메뉴, 1스테이지, 보스방 등을 각각의 씬으로

2. 게임 오브젝트 (Game Object)
개념: 씬에 배치되는 모든 요소 (캐릭터, 배경, 카메라, 조명 등)
그 자체로는 빈 껍데기지만, 어떤 컴포넌트(Component)를 붙이느냐에 따라 역할이 결정

3. 컴포넌트 (Component)
기능: 오브젝트에 기능을 부여하는 부품
대표 종류:
Transform: 위치, 회전, 크기 (모든 오브젝트에 필수)
Sprite Renderer: 2D 이미지를 화면에 그리는 역할
Rigidbody 2D: 물리 법칙(중력, 마찰 등) 적용
Box Collider 2D: 충돌 범위 설정

4. 하이어라키 (Hierarchy) & 프로젝트 (Project) 창
Hierarchy: 현재 씬에 나와 있는 오브젝트들의 목록(계층 구조)
Project: 게임에 사용할 소스 코드, 이미지(Sprite), 사운드 등 모든 에셋이 보관되는 저장소

===

인스펙터 (Inspector): 오브젝트를 클릭했을 때 해당 오브젝트의 컴포넌트 수치를 실시간으로 조절하는 곳입니다.

===

탑다운 필수 컴포넌트 설정
Rigidbody 2D: * Gravity Scale을 0으로 설정 (안 하면 캐릭터가 아래로 추락함).
Collision Detection을 Continuous로 설정 (벽 뚫기 방지).
Box Collider 2D: 캐릭터나 벽의 충돌 범위 지정.

===

Rigidbody 기반 이동 코드
```
using UnityEngine;

public class PlayerMove : MonoBehaviour 
{
    public float speed = 5f;
    Rigidbody2D rb;
    Vector2 moveVec;

    void Start() => rb = GetComponent<Rigidbody2D>();

    void Update() 
    {
        // 입력 받기 (WASD / 방향키)
        moveVec.x = Input.GetAxisRaw("Horizontal");
        moveVec.y = Input.GetAxisRaw("Vertical");
    }

    void FixedUpdate() 
    {
        // 물리 이동 (대각선 속도 보정 포함)
        rb.MovePosition(rb.position + moveVec.normalized * speed * Time.fixedDeltaTime);
    }
}
```