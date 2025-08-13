import { useEffect, useRef, useState } from "react";
import "./App.css";

// clamp util
const clamp = (n, min, max) => Math.min(Math.max(n, min), max);

export default function App() {
  // ===== game state =====
  const [running, setRunning] = useState(true);
  const [score, setScore] = useState(0);
  const [hp, setHp] = useState(5);            // ★ 시작 HP = 5
  const [gameOver, setGameOver] = useState(false);

  // player physics
  const floorHeight = 80;                      // CSS와 동일
  const groundY = 0;
  const [playerY, setPlayerY] = useState(groundY);
  const [velY, setVelY] = useState(0);
  const [isJumping, setIsJumping] = useState(false);
  const [isCrouching, setIsCrouching] = useState(false);

  // obstacles (ceiling bars)
  const [obstacles, setObstacles] = useState([]);

  // constants
  const gravity = 2000;                        // px/s^2
  const jumpStrength = 800;                    // px/s
  const runSpeed = 280;                        // px/s
  const gameWidth = 960;
  const obstacleSpeed = runSpeed;


  // refs for loop / throttles
  const rafRef = useRef(null);
  const lastTimeRef = useRef(performance.now());
  const scoreAccRef = useRef(0);               // 10Hz 점수 갱신
  const crouchAccRef = useRef(0);              // 엎드리기 HP 소모 누적

  const runningRef = useRef(running);
  const yRef = useRef(playerY);
  const vRef = useRef(velY);
  const jumpingRef = useRef(isJumping);
  const crouchRef = useRef(isCrouching);
  const hpRef = useRef(hp);
  const obstaclesRef = useRef(obstacles);

  // DOM refs to avoid re-render for background scroll
  const skyRef = useRef(null);
  const floorRef = useRef(null);
  const skyXRef = useRef(0);
  const floorXRef = useRef(0);

  useEffect(() => { runningRef.current = running; }, [running]);
  useEffect(() => { yRef.current = playerY; }, [playerY]);
  useEffect(() => { vRef.current = velY; }, [velY]);
  useEffect(() => { jumpingRef.current = isJumping; }, [isJumping]);
  useEffect(() => { crouchRef.current = isCrouching; }, [isCrouching]);
  useEffect(() => { hpRef.current = hp; }, [hp]);
  useEffect(() => { obstaclesRef.current = obstacles; }, [obstacles]);

  // 탭 제목
  useEffect(() => { document.title = "슈퍼마리오st"; }, []);

  // 입력
  useEffect(() => {
    const onKeyDown = (e) => {
      if (e.repeat) return;

      if (e.code === "ArrowDown" || e.key === "Control") {
        setIsCrouching(true);
      }
      if (e.code === "Enter") {
        // 게임 오버 상태면 재시작, 아니면 일시정지/재개
        if (gameOver) {
          handleRestart();
        } else {
          setRunning((r) => !r);
        }
      }
    };
    const onKeyUp = (e) => {
      if (e.code === "ArrowDown" || e.key === "Control") {
        setIsCrouching(false);
      }
    };
    window.addEventListener("keydown", onKeyDown, { passive: false });
    window.addEventListener("keyup", onKeyUp);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
    };
  }, [gameOver]);

  const doJump = () => {
    if (!jumpingRef.current && yRef.current === groundY && !gameOver) {
      setIsJumping(true);
      setVelY(-jumpStrength);
      vRef.current = -jumpStrength;
      jumpingRef.current = true;
    }
  };

  // 막대바 생성 (더 자주, 낮게 — 엎드리지 않으면 맞게)
  useEffect(() => {
    if (!running || gameOver) return;
    let alive = true;
    const schedule = () => {
      if (!alive) return;
      const ms = 800 + Math.random() * 700; // 0.8~1.5초
      setTimeout(() => {
        if (!alive || !runningRef.current || gameOver) return;

        const width = 90 + Math.floor(Math.random() * 90);
        const thickness = 18 + Math.floor(Math.random() * 10);
        const clearance = 40 + Math.floor(Math.random() * 10); // 바닥에서 40~50px

        setObstacles((obs) => [
          ...obs,
          { x: gameWidth, width, height: thickness, bottom: floorHeight + clearance, type: "bar", hit: false }
        ]);
        schedule();
      }, ms);
    };
    schedule();
    return () => { alive = false; };
  }, [running, gameOver]);

  // 메인 루프
  useEffect(() => {
    const tick = (now) => {
      const dt = (now - lastTimeRef.current) / 1000;
      lastTimeRef.current = now;

      if (runningRef.current && !gameOver) {
        // 배경 스크롤 (DOM 스타일로만)
        floorXRef.current = (floorXRef.current + runSpeed * dt) % 64;
        skyXRef.current = (skyXRef.current + runSpeed * 0.35 * dt) % 512;
        if (floorRef.current) floorRef.current.style.backgroundPositionX = `-${floorXRef.current}px`;
        if (skyRef.current) skyRef.current.style.backgroundPositionX = `-${skyXRef.current}px`;

        // 점수 10Hz
        scoreAccRef.current += dt;
        if (scoreAccRef.current >= 0.1) {
          scoreAccRef.current -= 0.1;
          setScore((s) => s + Math.floor(runSpeed * 0.1));
        }



        // 플레이어 물리
        if (jumpingRef.current) {
          let vy = vRef.current + gravity * dt;
          let py = yRef.current + vy * dt;
          if (py > groundY) { py = groundY; vy = 0; jumpingRef.current = false; setIsJumping(false); }
          vRef.current = vy; yRef.current = py;
          setVelY(vy); setPlayerY(py);
        }

        // 장애물 이동 + 제거
        setObstacles((obs) =>
          obs
            .map(o => ({ ...o, x: o.x - obstacleSpeed * dt }))
            .filter(o => o.x + o.width > 0)
        );

        // 충돌 판정 (AABB) — 부딪혀도 멈추지 않고 HP만 1 깎기 (장애물당 1회)
        const pLeft = 24;
        const pBottom = floorHeight;
        const pH = (crouchRef.current && yRef.current === groundY) ? 38 : 58;
        const pW = (crouchRef.current && yRef.current === groundY) ? 54 : 42;
        const pRight = pLeft + pW;
        const pTop = pBottom + pH + yRef.current;

        setObstacles((obs) =>
          obs.map(o => {
            if (!o.hit) {
              const left = o.x, right = o.x + o.width;
              const bottom = o.bottom, top = o.bottom + o.height;
              const overlap =
                pRight > left &&
                pLeft < right &&
                pTop > bottom &&
                pBottom < top;
              if (overlap) {
                o.hit = true;
                damageHp(1); // ★ 충돌 시 HP 1 깎기 (멈추지 않음)
              }
            }
            return o;
          })
        );
      }

      rafRef.current = requestAnimationFrame(tick);
    };

    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, [gameOver]);

  // HP 감소 유틸
  const damageHp = (amount) => {
    setHp((prev) => {
      if (prev <= 0) return 0;
      const next = Math.max(0, prev - amount);
      if (next === 0) {
        // 게임 오버
        setRunning(false);
        setGameOver(true);
      }
      return next;
    });
  };

  // 재시작
  const handleRestart = () => {
    setScore(0);
    setHp(5);                    // ★ 초기 HP 5로 리셋
    setObstacles([]);
    setPlayerY(groundY);
    setVelY(0);
    setIsJumping(false);
    setIsCrouching(false);
    lastTimeRef.current = performance.now();
    setGameOver(false);
    setRunning(true);
  };

  // 파생 렌더 값
  const playerHeight = isCrouching && playerY === groundY ? 38 : 58;
  const playerWidth = isCrouching && playerY === groundY ? 54 : 42;
  const playerTilt = isJumping ? clamp(-velY / 1200, -15, 20) : 0;

  return (
    <div className="wrap">
      <h1 className="title">슈퍼마리오 st</h1>

      <div className="game">
        {/* sky */}
        <div className="sky" ref={skyRef}>
          <div className="cloud c1" />
          <div className="cloud c2" />
          <div className="cloud c3" />
        </div>

        {/* floor */}
        <div className="floor" ref={floorRef} />

        {/* obstacles */}
        {obstacles.map((o, i) => (
          <div
            key={i}
            className={`obstacle bar ${o.hit ? "hit" : ""}`}
            style={{ left: o.x, bottom: o.bottom, width: o.width, height: o.height }}
          />
        ))}

        {/* player */}
        <div
          className="player"
          style={{
            transform: `translateY(${-playerY}px) rotate(${playerTilt}deg)`,
            height: playerHeight,
            width: playerWidth
          }}
          aria-label="player"
        />

        {/* HUD */}
        <div className="hud">
          SCORE {score} | HP {hp}
          {!running && !gameOver ? " (일시정지)" : ""}
        </div>

        {/* GAME OVER 팝업 */}
        {gameOver && (
          <div className="overlay">
            <div className="modal">
              <h2>GAME OVER</h2>
              <p>점수: {score}</p>
              <button className="btn" onClick={handleRestart}>재시작</button>
            </div>
          </div>
        )}
      </div>

      {/* 하단 컨트롤 */}
      <div className="controls">
        <button
          className="btn"
          onPointerDown={() => setIsCrouching(true)}
          onPointerUp={() => setIsCrouching(false)}
          onPointerCancel={() => setIsCrouching(false)}
          onMouseDown={() => setIsCrouching(true)}
          onMouseUp={() => setIsCrouching(false)}
          onMouseLeave={() => setIsCrouching(false)}
        >
          엎드리기
        </button>
        <button
          className="btn"
          onClick={() => {
            if (gameOver) handleRestart();
            else setRunning(r => !r);
          }}
        >
          {gameOver ? "재시작" : (running ? "일시정지" : "시작")}
        </button>
      </div>
    </div>
  );
}
