// src/scenes/MenuScene.ts
import Phaser from "phaser";
import { getTheme } from "../theme";
import { MenuButton } from "../ui/MenuButton";
import { t } from "../i18n";
import { swapTo } from "../animations/transitions";
import { hasUnlocked2048 } from "../storage";
import { showPrivacyOptions } from "../privacy/consent";

// Helpers de robustez
function killAllTweensOf(scene: Phaser.Scene) {
  scene.tweens.killAll();
  scene.children.each((go: any) => {
    scene.tweens.killTweensOf(go);
    if (go?.list) scene.tweens.killTweensOf(go.list);
  });
}

function resetCamera(scene: Phaser.Scene) {
  const cam = scene.cameras.main;
  cam.stopFollow();
  cam.setScroll(0, 0);
  cam.setZoom(1);
  cam.setRotation(0);
}

/** Para versões do Phaser que não têm getScenes(): para tudo que não é o Menu. */
function stopOtherScenesSafely(scene: Phaser.Scene) {
  const plugin: any = scene.scene; // ScenePlugin
  const knownKeys = [
    "GameScene",
    "ModesScene",
    "OptionsScene",
    "ThemeScene",
    "PreloadScene",
    "BootScene"
  ];
  for (const key of knownKeys) {
    if (key !== scene.scene.key && plugin.isActive?.(key)) {
      plugin.stop(key);
    }
  }
}

export default class MenuScene extends Phaser.Scene {
  constructor() {
    super("MenuScene");
  }

  create() {
    // 1) Zera estado herdado e garante input básico
    resetCamera(this);
    killAllTweensOf(this);

    this.scene.bringToTop(this.scene.key);
    this.input.enabled = true;
    this.input.setTopOnly(true); // clique só pega o topo

    // 2) STOP em outras cenas ativas (sem usar getScenes)
    stopOtherScenesSafely(this);

    const c = getTheme().colors;
    const { width, height } = this.scale;
    const cx = Math.round(width / 2);
    const unlocked = !!hasUnlocked2048();

    // Root do menu (facilita layout/reset)
    const ui = this.add.container(0, 0).setName("menuRoot").setScrollFactor(0, 0);

    // Título
    const title = this.add.text(
      cx,
      Math.round(height * 0.18),
      t("menu_title"),
      {
        fontFamily: "Arial, Helvetica, sans-serif",
        fontSize: "36px",
        color: c.text,
      }
    ).setOrigin(0.5);
    ui.add(title);

    // Subtítulo
    const subtitle = this.add.text(
      cx,
      title.y + 36,
      t("menu_subtitle") || t("footer_game_name"),
      {
        fontFamily: "Arial, Helvetica, sans-serif",
        fontSize: "14px",
        color: c.textDim,
      }
    ).setOrigin(0.5, 0);
    ui.add(subtitle);

    // Botões
    const spacing = 88;
    const btnWidth = Math.min(360, Math.floor(width * 0.84));
    let y = Math.round(height * 0.42);

    const play = new MenuButton(
      this,
      cx,
      y,
      t("menu_play_classic"),
      () => swapTo(this, "GameScene", {}, "fade"),
      btnWidth
    );
    ui.add(play);
    y += spacing;

    const modes = new MenuButton(
      this,
      cx,
      y,
      t("menu_other_modes"),
      () => {
        if (!hasUnlocked2048()) return;
        swapTo(this, "ModesScene", {}, "fade");
      },
      btnWidth
    );
    modes.setEnabled(unlocked);
    ui.add(modes);

    if (!unlocked) {
      const lockMsg = this.add.text(
        cx,
        y + Math.round(spacing * 0.42),
        t("menu_modes_locked"),
        {
          fontFamily: "Arial, Helvetica, sans-serif",
          fontSize: "12px",
          color: c.textDim,
        }
      ).setOrigin(0.5, 0);
      ui.add(lockMsg);
    }

    y += spacing;

    const options = new MenuButton(
      this,
      cx,
      y,
      t("menu_options"),
      () => swapTo(this, "OptionsScene", {}, "fade"),
      btnWidth
    );
    ui.add(options);
    y += spacing;
    const themes = new MenuButton(
      this,
      cx,
      y,
      t("themes"),
      () => {

        swapTo(this, "ThemeScene", {}, "fade");
      },
      btnWidth
    );
    ui.add(themes);
    y += spacing;
    const exit = new MenuButton(
      this,
      cx,
      y,
      t("menu_exit"),
      () => {
        const cap = (window as any).Capacitor;
        if (cap?.isNativePlatform?.()) {
          (navigator as any).app?.exitApp?.() ?? this.game.destroy(true);
        } else {
          history.length > 1 ? history.back() : location.reload();
        }
      },
      btnWidth
    );
    ui.add(exit);

    // Footer
    this.add.text(
      cx,
      height - 18,
      t("footer_game_name"),
      {
        fontFamily: "Arial, Helvetica, sans-serif",
        fontSize: "12px",
        color: c.textDim,
      }
    ).setOrigin(0.5, 1);

    // 3) Layout estável (sem animações residuais)
    this.tweens.killTweensOf(ui);
    ui.setPosition(0, 0).setScale(1).setAlpha(1);

    // 4) Limpeza ao sair
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      killAllTweensOf(this);
      this.time.removeAllEvents();
      this.input.removeAllListeners();
    });

    // 5) Robustece ao voltar/“acordar”
    this.events.on(Phaser.Scenes.Events.WAKE, () => {
      resetCamera(this);
      killAllTweensOf(this);
      this.scene.bringToTop(this.scene.key);
      this.input.enabled = true;
      this.input.setTopOnly(true);

      // Reposiciona sem tween
      const buttons: any[] = [play, modes, themes, options, exit];
      let ly = Math.round(this.scale.height * 0.42);
      const lcx = Math.round(this.scale.width / 2);
      for (const b of buttons) {
        b.setPosition?.(lcx, ly);
        this.tweens.killTweensOf(b);
        if ((b as any)?.list) this.tweens.killTweensOf((b as any).list);
        b.setAlpha?.(1);
        b.setScale?.(1);
        ly += spacing;
      }
      this.tweens.killTweensOf(ui);
      ui.setPosition(0, 0).setAlpha(1).setScale(1);
      // E, por via das dúvidas, para de novo qualquer outra cena
      stopOtherScenesSafely(this);
    });
  }
}
