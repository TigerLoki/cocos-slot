import { _decorator, Component, Sprite, Node } from 'cc';
import { SymbolCache } from './SymbolCache';

const { ccclass, property } = _decorator;

@ccclass('SymbolItem')
export class SymbolItem extends Component {
    @property(Sprite) mainSprite: Sprite = null;
    @property(Node) winFrameNode: Node = null;

    onLoad() {
        if (!this.mainSprite) this.mainSprite = this.getComponent(Sprite);
        if (!this.winFrameNode) this.winFrameNode = this.node.getChildByName('WinFrame');
        this.showWinFrame(false);
    }

    public setSymbolId(id: number) {
        const frame = SymbolCache.getFrame(id);
        if (frame && this.mainSprite) {
            this.mainSprite.spriteFrame = frame;
        }
    }

    public showWinFrame(visible: boolean) {
        if (this.winFrameNode) this.winFrameNode.active = visible;
    }
}