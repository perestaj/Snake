import { Direction } from "./direction";
import { Coordinate } from "./coordinate";

export class Snake {    
    private segments: Coordinate[];
    private lastSegment: Coordinate;
    private maxXSegments: number;
    private maxYSegments: number;

    public direction = Direction.Left;
    
    constructor(maxXSegments: number, maxYSegments: number, initialLength: number) {
        this.maxXSegments = maxXSegments;
        this.maxYSegments = maxYSegments;
        
        this.segments = [];

        for (let i = 0; i < initialLength; i++) {
            this.segments.push(new Coordinate(Math.floor((maxXSegments - initialLength) / 2) + i, Math.floor(maxYSegments / 2)));
        }
    }

    public move(direction: Direction): void {
        const last = this.segments[this.segments.length - 1];
        this.lastSegment = new Coordinate(last.x, last.y);
        
        const length = this.segments.length;
        for (let i = length - 1; i > 0; i--) {
            const current = this.segments[i];
            const previous = this.segments[i-1];

            current.x = previous.x;
            current.y = previous.y;
        }

        const firstSegment = this.segments[0];

        switch(direction) {
            case Direction.Up:
                firstSegment.y--;
                if (firstSegment.y < 0) {
                    firstSegment.y = this.maxYSegments - 1;
                }                
                break;
            case Direction.Down:
                firstSegment.y++;
                if (firstSegment.y > this.maxYSegments - 1) {
                    firstSegment.y = 0;
                }                
                break;
            case Direction.Left:
                firstSegment.x--;
                if (firstSegment.x < 0) {
                    firstSegment.x = this.maxXSegments - 1;
                }                
                break;
            case Direction.Right:
                firstSegment.x++;
                if (firstSegment.x > this.maxXSegments - 1) {
                    firstSegment.x = 0;
                }                
                break;
        }
    }

    public grow(): void {
        if (this.lastSegment) {
            this.segments.push(this.lastSegment);
        }        
    }

    public getSegments(): ReadonlyArray<Coordinate> {
        return this.segments;
    }
}