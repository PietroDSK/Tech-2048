import { t } from './i18n'
export type AlertResult = 'new' | 'close'
export function showGameOver(score: number): Promise<AlertResult> {
  ensureModalExists()
  const overlay = document.getElementById('modalOverlay') as HTMLDivElement
  const titleEl = document.getElementById('modalTitle') as HTMLHeadingElement
  const bodyEl = document.getElementById('modalBody') as HTMLParagraphElement
  const btnPrimary = document.getElementById('modalPrimary') as HTMLButtonElement
  const btnSecondary = document.getElementById('modalSecondary') as HTMLButtonElement
  titleEl.textContent = t("game_over_title")
  bodyEl.textContent = t("game_over_score", { score })
  btnPrimary.textContent = t("try_again")
  btnSecondary.textContent = t("close")
  overlay.classList.remove('hidden'); overlay.classList.add('show')
  return new Promise<AlertResult>((resolve) => {
    const onClose = (result: AlertResult) => {
      overlay.classList.remove('show'); overlay.classList.add('hidden')
      btnPrimary.removeEventListener('click', onPrimary); btnSecondary.removeEventListener('click', onSecondary); overlay.removeEventListener('click', onOverlay)
      resolve(result)
    }
    const onPrimary = () => onClose('new'); const onSecondary = () => onClose('close')
    const onOverlay = (e: MouseEvent) => { if (e.target === overlay) onClose('close') }
    btnPrimary.addEventListener('click', onPrimary); btnSecondary.addEventListener('click', onSecondary); overlay.addEventListener('click', onOverlay, { once: true })
  })
}
function ensureModalExists(){
  if (document.getElementById('modalOverlay')) return
  const overlay = document.createElement('div'); overlay.id = 'modalOverlay'; overlay.className = 'modal hidden'
  overlay.innerHTML = `
    <div class="modal-dialog">
      <div class="modal-header"><h3 id="modalTitle">Title</h3></div>
      <div class="modal-body"><p id="modalBody">Body</p></div>
      <div class="modal-actions"><button id="modalPrimary" class="btn primary">OK</button><button id="modalSecondary" class="btn ghost">Close</button></div>
    </div>`
  document.body.appendChild(overlay)
}
export function ensureSettingsMenu(){
  if (document.getElementById('menuOverlay')) return
  const overlay = document.createElement('div')
  overlay.id = 'menuOverlay'
  overlay.className = 'modal hidden'
  overlay.innerHTML = `
    <div class="modal-dialog" role="dialog" aria-labelledby="menuTitle">
      <div class="modal-header">
        <h3 id="menuTitle">${t("menu_title")}</h3>
      </div>
      <div class="modal-body">
        <div class="settings-list">
          <div class="settings-row">
            <label for="menuToggleLabels"><span data-i18n="labels">${t("tech_labels")}</span></label>
            <input type="checkbox" id="menuToggleLabels">
          </div>
          <div class="settings-row">
            <label for="menuToggleSound"><span data-i18n="sound">${t("sound")}</span></label>
            <input type="checkbox" id="menuToggleSound">
          </div>
          <div class="settings-row">
            <label for="menuLangSelect"><span data-i18n="lang">${t("language")}</span></label>
            <select id="menuLangSelect">
              <option value="pt-BR">pt-BR</option>
              <option value="en">English</option>
            </select>
          </div>
          <div class="settings-row">
            <button id="menuNewGame" class="btn" data-i18n="newGame">${t("new_game")}</button>
            <button id="menuClose" class="btn ghost">${t("close")}</button>
          </div>
        </div>
      </div>
    </div>`
  document.body.appendChild(overlay)
}
export function openSettingsMenu(){
  const overlay = document.getElementById('menuOverlay') as HTMLDivElement
  overlay?.classList.remove('hidden'); overlay?.classList.add('show')
}
export function closeSettingsMenu(){
  const overlay = document.getElementById('menuOverlay') as HTMLDivElement
  overlay?.classList.remove('show'); overlay?.classList.add('hidden')
}
