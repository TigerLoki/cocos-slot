import { _decorator, Component, Prefab, instantiate } from 'cc';
import { SymbolItem } from './SymbolItem';
import { SymbolCache } from './SymbolCache';

const { ccclass, property } = _decorator;

type REEL_STATE = 'idle' | 'waiting' | 'spinning' | 'roll-back';

@ccclass('Reel')
export class Reel extends Component {
    @property(Prefab) symbolPrefab: Prefab = null;

    @property symbolDistance: number = 180;
    @property maxSpeed: number = 28;
    @property acceleration: number = 24;
    @property backwardsAcceleration: number = 60;
    @property queueLength: number = 8;
    @property startUpSpeed: number = 5;

    private items: SymbolItem[] = [];
    private yShift = 0;
    private goForward = 0;
    private goBackward = 0;
    private state: REEL_STATE = 'idle';
    private delay = 0;
    private queue: number[] = [];
    private resolveSpinStop?: (value: unknown) => void;

    onLoad() {
        if (!this.symbolPrefab) return;
        for (let i = 0; i < 4; i++) {
            const node = instantiate(this.symbolPrefab);
            node.parent = this.node;
            this.items.push(node.getComponent(SymbolItem));
        }
        this.randomizeSymbols();
    }

    private randomizeSymbols() {
        for (const item of this.items) {
            item.setSymbolId(Math.floor(Math.random() * SymbolCache.getTotalCount()));
        }
    }

    startSpin(delay: number, target: [number, number, number]): Promise<void> {
        return new Promise((resolve) => {
            this.resolveSpinStop = resolve;
            this.state = 'waiting';
            this.goBackward = this.startUpSpeed;
            this.goForward = 0;
            this.delay = delay;
            this.yShift = 0;
            const total = SymbolCache.getTotalCount();
            this.queue = [
                ...Array.from({ length: this.queueLength }, () => Math.floor(Math.random() * total)),
                ...target,
                Math.floor(Math.random() * total),
            ];
        });
    }

    update(dt: number) {
        switch (this.state) {
            case 'waiting': this.updateWaiting(dt); break;
            case 'spinning': this.updateSpinning(dt); break;
            case 'roll-back': this.updateRollBack(dt); break;
        }
        this.applyPositions();
    }

    private applyPositions() {
        for (let i = 0; i < 4; i++) {
            this.items[i].node.y = (i - 2) * this.symbolDistance + this.yShift;
        }
    }

    private updateWaiting(dt: number) {
        this.delay -= dt;
        if (this.delay < 0) this.state = 'spinning';
    }

    private updateSpinning(dt: number) {
        if (this.yShift > this.symbolDistance) {
            this.yShift -= this.symbolDistance;
            const total = SymbolCache.getTotalCount();
            const nextId = this.queue.length > 0 ? this.queue.shift()! : Math.floor(Math.random() * total);
            const bottom = this.items.pop()!;
            bottom.setSymbolId(nextId);
            this.items.unshift(bottom);
        }

        const valueChange = dt * this.acceleration;
        this.goForward = Math.min(this.goForward + valueChange, this.maxSpeed);
        this.goBackward = Math.max(this.goBackward - valueChange, 0);
        this.yShift += this.goForward - this.goBackward;

        if (this.queue.length === 0) {
            this.state = 'roll-back';
            this.goForward /= 3;
        }
    }

    private updateRollBack(dt: number) {
        const valueChange = dt * this.backwardsAcceleration;
        this.goBackward = 0;
        this.goForward = Math.max(this.goForward - valueChange, -this.maxSpeed);

        if (this.yShift < 0) {
            this.yShift = 0;
            this.state = 'idle';
            this.resolveSpinStop?.(null);
            this.resolveSpinStop = undefined;
            return;
        }
        this.yShift += this.goForward;
    }

    public highlightIndices(indices: number[]) {
        indices.forEach(i => {
            if (i >= 0 && i < this.items.length) {
                this.items[i].showWinFrame(true);
            }
        });
    }

    public clearWinFrames() {
        this.items.forEach(item => item.showWinFrame(false));
    }
}