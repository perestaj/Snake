import {
  AfterViewInit,
  Component,
  ElementRef,
  HostListener,
  NgZone,
  OnDestroy,
  Renderer2,
  ViewChild,
} from "@angular/core";
import { Platform, ViewDidEnter } from "@ionic/angular";
import { Subscription } from "rxjs";
import { Game, SegmentSize } from "../game/game";
import { GameState } from "../game/game-state";

import { Direction } from "../game/direction";
import { Turn } from "../game/turn";

@Component({
  selector: "app-home",
  templateUrl: "home.page.html",
  styleUrls: ["home.page.scss"],
})
export class HomePage implements AfterViewInit, OnDestroy, ViewDidEnter {
  private game: Game;
  private gameState: GameState;
  private gameStateSubscription: Subscription;
  private foodEatenSubscription: Subscription;

  @ViewChild("canvas", { static: false }) private canvas: ElementRef;
  @ViewChild("grid", { static: false }) private grid: ElementRef;
  @ViewChild("content", { static: false }) private content: ElementRef;
  @ViewChild("map", {static: false}) private map: ElementRef;

  public canvasPanelHeight = 0;
  public mapWidth: number;
  public mapHeight: number;

  public score = 0;
  public infoVisible = true;
  public movementsInfoVisible = true;
  public info = "";
  public controlInfo = "";

  constructor(private ngZone: NgZone, private renderer: Renderer2, private platform: Platform) {}
  
  public ngAfterViewInit(): void {
    this.renderer.listen(this.map.nativeElement, "touchstart", (ev: TouchEvent) => {
      ev.stopPropagation();
      console.log('touchstart');
      if (this.gameState === GameState.Started) {
        if (ev.touches && ev.touches.length > 0) {
          const x = ev.touches[0].clientX;
          let turn = x < this.mapWidth / 2 ? Turn.Left : Turn.Right;
          this.game.turnSnake(turn);
        }
      } else {
        this.game.start();
      }
    });
  }

  public ionViewDidEnter(): void {
    this.canvasPanelHeight = this.content.nativeElement.offsetHeight - this.grid.nativeElement.offsetHeight;

    this.mapWidth = Math.floor(this.content.nativeElement.offsetWidth / SegmentSize) * SegmentSize;
    this.mapHeight = Math.floor(this.canvasPanelHeight / SegmentSize) * SegmentSize;

    const context = this.canvas.nativeElement.getContext("2d");   

    this.game = new Game(this.mapWidth, this.mapHeight, context, this.ngZone);
    this.gameStateSubscription = this.game.gameStateChanged.subscribe((state: GameState) => {
      this.gameState = state;

      if (state === GameState.Stopped) {
        this.info = 'Game Over :(';
        this.infoVisible = true;
      } else {
        this.score = 0;
        this.infoVisible = false;
        this.movementsInfoVisible = false;
      }
    });

    this.foodEatenSubscription = this.game.foodEaten.subscribe(_ => this.score += 10);

    this.score = 0;    
    const isMobile = this.platform.is('android') || this.platform.is('ios');
    this.info = isMobile ? "Tap to start" : "Press space to start";
    this.controlInfo = isMobile ? 
      "Tap the left side of the screen to turn left or the right side of the screen to turn right" : 
      "Use the arrow keys to change snake direction";
    this.infoVisible = true;
  }

  public ngOnDestroy(): void {
    this.game.stop();

    if (this.gameStateSubscription) {
      this.gameStateSubscription.unsubscribe();
    }

    if (this.foodEatenSubscription) {
      this.foodEatenSubscription.unsubscribe();
    }
  } 
  
  @HostListener("document:keydown", ["$event"])
  public onKeyUp(ev: KeyboardEvent): void {
    ev.preventDefault();
    switch (ev.key) {
      case "Down": // IE/Edge specific value
      case "ArrowDown":
        this.game.changeDirection(Direction.Down);
        return;
      case "Up": // IE/Edge specific value
      case "ArrowUp":
        this.game.changeDirection(Direction.Up);
        return;
      case "Left": // IE/Edge specific value
      case "ArrowLeft":
        this.game.changeDirection(Direction.Left);
        return;
      case "Right": // IE/Edge specific value
      case "ArrowRight":
        this.game.changeDirection(Direction.Right);
        return;
    }

    if (ev.code === 'Space') {
      if (this.gameState !== GameState.Started) {
        this.game.start();
      }
    }
  }
}
