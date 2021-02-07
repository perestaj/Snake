import { NgZone } from "@angular/core";
import { Subject } from "rxjs";
import { Coordinate } from "./coordinate";
import { Direction } from "./direction";
import { Snake } from "./snake";
import { Turn } from "./turn";
import { GameState } from "./game-state";

export const SegmentSize = 30;

export class Game {
  private gameState: GameState;  
  private snake: Snake;
  private snakeInitialLength: number;
  private maxXSegments: number;
  private maxYSegments: number;

  private foodCoordinates: Coordinate;

  private selectedDirection: Direction = Direction.Left;
  private snakeDirection = Direction.Left;

  private gameLoopHandle: number;
  private gameCallbackTimestamp: number;

  public gameStateChanged: Subject<GameState> = new Subject();
  public foodEaten: Subject<void> = new Subject();

  constructor(private mapWidth: number, private mapHeight: number, private context: any, private ngZone: NgZone) {
    this.gameState = GameState.Stopped;

    this.context.clearRect(0, 0, this.mapWidth, this.mapHeight);
    this.context.fillStyle = '#01dd01';
    this.context.fillRect(50, 50, 150, 150);

    const minimum = Math.min(this.mapWidth, this.mapHeight);
    this.snakeInitialLength = Math.ceil(0.2 * minimum / SegmentSize);

    this.maxXSegments = this.mapWidth / SegmentSize;
    this.maxYSegments = this.mapHeight / SegmentSize;

    this.snake = new Snake(this.maxXSegments, this.maxYSegments, this.snakeInitialLength);
  }

  public start(): void {
    if (this.gameState === GameState.Started) {
        return;
    }

    this.changeGameState(GameState.Started);

    this.snakeDirection = Direction.Left;
    this.selectedDirection = Direction.Left;    

    this.context.clearRect(0, 0, this.mapWidth, this.mapHeight);      
    this.snake = new Snake(this.maxXSegments, this.maxYSegments, this.snakeInitialLength);
    this.drawSnake();    
    this.createFood();    

    this.gameCallbackTimestamp = 0;
    this.ngZone.runOutsideAngular(() => {      
      this.gameLoopHandle = requestAnimationFrame(this.gameCallback.bind(this));
    });
  }

  public stop(): void {
    if (this.gameLoopHandle) {        
        cancelAnimationFrame(this.gameLoopHandle);
    }

    this.changeGameState(GameState.Stopped);
  }

  public changeDirection(direction: Direction): void {
      switch(direction) {
          case Direction.Down:
            if (this.snakeDirection !== Direction.Up) {
                this.selectedDirection = Direction.Down;
            }        
            break;
        case Direction.Up:
            if (this.snakeDirection !== Direction.Down) {
                this.selectedDirection = Direction.Up;
                }     
                break;
        case Direction.Left:
            if (this.snakeDirection !== Direction.Right) {
                this.selectedDirection = Direction.Left;
                }        
                break;
        case Direction.Right:
            if (this.snakeDirection !== Direction.Left) {
                this.selectedDirection = Direction.Right;
                }     
                break;
      }    
  }

  public turnSnake(turn: Turn): void {
    let direction = this.snakeDirection

    switch(turn) {
      case Turn.Left:
        direction = this.snakeDirection - 1;
        if (direction < 1) {
          direction = 4;
        }

        this.selectedDirection = direction;
      break;
      case Turn.Right:
        direction = this.snakeDirection + 1;
        if (direction > 4) {
          direction = 1;
        }

        this.selectedDirection = direction;
      break;
    }
  }
    
  private createFood(): void {
    const segments = this.snake.getSegments();
    const map: Coordinate[] = [];

    for (let x = 0; x < this.maxXSegments; x++) {
      for (let y = 0; y < this.maxYSegments; y++) {        
        if (segments.some(coordinate => coordinate.x === x && coordinate.y === y)) {
          continue;
        }

        map.push(new Coordinate(x, y));
      }
    }

    const foodLocation = Math.floor(Math.random() * map.length);
    this.foodCoordinates = map[foodLocation];
   
    this.context.fillStyle = '#EC6300';
    this.context.fillRect(this.foodCoordinates.x * SegmentSize, this.foodCoordinates.y * SegmentSize, SegmentSize, SegmentSize);
      
  }

  private drawSnake(): void {
    this.context.fillStyle = '#01dd01';

    const segments = this.snake.getSegments();

    for (let i = 0; i < segments.length; i++) {
      const segment = segments[i];
      this.context.fillRect(SegmentSize * segment.x, SegmentSize * segment.y, SegmentSize, SegmentSize);
    }
  }
  
  private isFoodEaten(): boolean {
    if (!this.foodCoordinates) {
      return;
    }

    const head = this.snake.getSegments()[0];
    return head.x === this.foodCoordinates.x && head.y === this.foodCoordinates.y;    
  }

  private isSnakeBitten(): boolean {
    const segments = this.snake.getSegments();
    const head = segments[0];

    for (let i = 1; i < segments.length; i++) {
      const segment = segments[i];
      if (head.x === segment.x && head.y === segment.y) {
        return true;
      }
    }

    return false;
  }

  private gameCallback(timestamp: number): void {
    if (timestamp - this.gameCallbackTimestamp > 70) {
      this.gameCallbackTimestamp = timestamp;

      const segments = this.snake.getSegments();    
      const tail = segments[segments.length - 1];

      this.context.clearRect(SegmentSize * tail.x, SegmentSize * tail.y, SegmentSize, SegmentSize);

      this.snakeDirection = this.selectedDirection;
      this.snake.move(this.snakeDirection);
    
      this.drawSnake();

      if (this.isFoodEaten()) {
        this.ngZone.run(() => this.foodEaten.next());
        this.snake.grow();
        this.createFood();
      }

      if (this.isSnakeBitten()) {
        this.ngZone.run(() => this.stop());
        return;
      }
    }    

    this.gameLoopHandle = requestAnimationFrame(this.gameCallback.bind(this));
  }

  private changeGameState(state: GameState): void {
      this.gameState = state;
      this.gameStateChanged.next(state);
  }
}