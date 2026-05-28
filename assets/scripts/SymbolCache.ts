import { SpriteAtlas, SpriteFrame } from 'cc';

export class SymbolCache {
    private static cache: Map<number, SpriteFrame> = new Map();

    public static init(atlas: SpriteAtlas, namePrefix: string = 'symbol_') {
        this.cache.clear();
        if (!atlas) {
            return;
        }

        let i = 1;
        while (true) {
            const num = i < 10 ? '00' + i : i < 100 ? '0' + i : '' + i;
            const name = namePrefix + num;
            const frame = atlas.getSpriteFrame(name);
            if (frame) {
                this.cache.set(i - 1, frame);
                i++;
            } else {
                break;
            }
        }
    }

    public static getFrame(id: number): SpriteFrame | null {
        return this.cache.get(id) ?? null;
    }

    public static getTotalCount(): number {
        return this.cache.size;
    }
}