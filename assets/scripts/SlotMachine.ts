import { _decorator, Component, Button, Label, SpriteFrame } from 'cc';
import { SymbolCache } from './SymbolCache';
import { Reel } from './Reel';

const { ccclass, property } = _decorator;

@ccclass('SlotMachine')
export class SlotMachine extends Component {
    @property(Button) spinButton: Button = null;
    @property([Reel]) reels: Reel[] = [];
    @property([SpriteFrame]) symbols: SpriteFrame[] = [];

    private isSpinning = false;
    private readonly startDelay = 0.1;

    onLoad() {
        SymbolCache.init(this.symbols);
        this.spinButton.node.on('click', this.onSpinClick, this);
        this.spinButton.interactable = true;
    }

    async onSpinClick() {
        if (this.isSpinning) return;
        this.isSpinning = true;
        this.spinButton.interactable = false;

        this.reels.forEach(r => r.clearWinFrames());

        const results = this.generateResults();

        const promises = this.reels.map((reel, i) => {
            const delay = i * this.startDelay;
            return reel.startSpin(delay, results[i] as [number, number, number]);
        });

        await Promise.all(promises);

        const info = this.getResultsInfo(results);
        this.highlightWins(results, info);

        this.isSpinning = false;
        this.spinButton.interactable = true;
    }

    private getResultsInfo(results: number[][]) {
        const centers = results.map(r => r[1]);
        const freq = new Map<number, number>();
        centers.forEach(id => freq.set(id, (freq.get(id) || 0) + 1));
        const winIds = new Set<number>();
        freq.forEach((count, id) => { if (count >= 2) winIds.add(id); });
        return { centers, hasWin: winIds.size > 0, winIds };
    }

    private highlightWins(results: number[][], info: { winIds: Set<number> }) {
        this.reels.forEach((reel, i) => {
            if (info.winIds.has(results[i][1])) {
                reel.highlightIndices([2]);
            }
        });
    }

    private generateResults(): number[][] {
        const res: number[][] = [];
        for (let r = 0; r < 3; r++) {
            const reel: number[] = [];
            for (let s = 0; s < 3; s++) reel.push(Math.floor(Math.random() * 8));
            res.push(reel);
        }
        return res;
    }
}