import { SpriteFrame } from 'cc';

export class SymbolCache {
    private static cache: Map<number, SpriteFrame> = new Map();

    public static init(frames: SpriteFrame[]) {
        this.cache.clear();
        frames.forEach((frame, index) => this.cache.set(index, frame));
    }

    public static getFrame(id: number): SpriteFrame | null {
        return this.cache.get(id) ?? null;
    }
}