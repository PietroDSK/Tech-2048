import type { Lang } from './i18n'
import { t } from './i18n'
export type AlertResult = 'new' | 'close'
export function showGameOver(lang: Lang, score: number): Promise<AlertResult> {
  ensureModalExists()
  const overlay = document.getElementById('modalOverlay') as HTMLDivElement
  const titleEl = document.getElementById('modalTitle') as HTMLHeadingElement
  const bodyEl = document.getElementById('modalBody') as HTMLParagraphElement
  const btnPrimary = document.getElementById('modalPrimary') as HTMLButtonElement
  const btnSecondary = document.getElementById('modalSecondary') as HTMLButtonElement
  titleEl.textContent = t(lang, 'alert.gameOver.title')
  bodyEl.textContent = t(lang, 'alert.gameOver.desc', { score })
  btnPrimary.textContent = t(lang, 'alert.gameOver.new')
  btnSecondary.textContent = t(lang, 'alert.gameOver.close')
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
