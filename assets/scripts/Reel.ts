import { _decorator, Component, Prefab, instantiate } from 'cc';
import { SymbolItem } from './SymbolItem';

const { ccclass, property } = _decorator;

const SYM_DISTANCE = 180;
const REEL_MAX_SPEED = 28;
const REEL_ACCELERATION = 24;
const REEL_BACKWARDS_ACCELERATION = 60;
const SPIN_QUEUE_LENGTH = 8;

type REEL_STATE = 'idle' | 'waiting' | 'spinning' | 'roll-back';

@ccclass('Reel')
export class Reel extends Component {
    @property(Prefab) symbolPrefab: Prefab = null;

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
            item.setSymbolId(Math.floor(Math.random() * 8));
        }
    }

    startSpin(delay: number, target: [number, number, number]): Promise<void> {
        return new Promise((resolve) => {
            this.resolveSpinStop = resolve;
            this.state = 'waiting';
            this.goBackward = 5;
            this.goForward = 0;
            this.delay = delay;
            this.yShift = 0;

            this.queue = [
                ...Array.from({ length: SPIN_QUEUE_LENGTH }, () => Math.floor(Math.random() * 8)),
                ...target,
                Math.floor(Math.random() * 8),
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
            this.items[i].node.y = i * SYM_DISTANCE - SYM_DISTANCE * 2 + this.yShift;
        }
    }

    private updateWaiting(dt: number) {
        this.delay -= dt;
        if (this.delay < 0) this.state = 'spinning';
    }

    private updateSpinning(dt: number) {
        if (this.yShift > SYM_DISTANCE) {
            this.yShift -= SYM_DISTANCE;
            const nextId = this.queue.length > 0 ? this.queue.shift()! : Math.floor(Math.random() * 8);
            const bottom = this.items.pop()!;
            bottom.setSymbolId(nextId);
            this.items.unshift(bottom);
        }

        const valueChange = dt * REEL_ACCELERATION;
        this.goForward = Math.min(this.goForward + valueChange, REEL_MAX_SPEED);
        this.goBackward = Math.max(this.goBackward - valueChange, 0);
        this.yShift += this.goForward - this.goBackward;

        if (this.queue.length === 0) {
            this.state = 'roll-back';
            this.goForward /= 3;
        }
    }

    private updateRollBack(dt: number) {
        const valueChange = dt * REEL_BACKWARDS_ACCELERATION;
        this.goBackward = 0;
        this.goForward = Math.max(this.goForward - valueChange, -REEL_MAX_SPEED);

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
        indices.forEach(i => this.items[i]?.showWinFrame(true));
    }

    public clearWinFrames() {
        this.items.forEach(item => item.showWinFrame(false));
    }
}