import { useState } from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from './assets/vite.svg'
import heroImg from './assets/hero.png'
import './App.css'

function App() {
  const [count, setCount] = useState(0)

  return (
    <>
      <section id="center">
        <div className="hero">
          <img src={heroImg} className="base" width="170" height="179" alt="" />
          <img src={reactLogo} className="framework" alt="React logo" />
          <img src={viteLogo} className="vite" alt="Vite logo" />
        </div>
        <div>
          <h1>Understanding Artifacts</h1>
          <p>
            How GitHub Actions workflows share build output with{' '}
            <code>actions/upload-artifact</code> and{' '}
            <code>actions/download-artifact</code>
          </p>
        </div>
        <button
          type="button"
          className="counter"
          onClick={() => setCount((count) => count + 1)}
        >
          Artifacts collected: {count}
        </button>
      </section>

      <div className="ticks"></div>

      <section id="next-steps">
        <div id="docs">
          <svg className="icon" role="presentation" aria-hidden="true">
            <use href="/icons.svg#documentation-icon"></use>
          </svg>
          <h2>What is an artifact?</h2>
          <p>Files a job produces and stores after the run</p>
          <ul>
            <li>
              <a
                href="https://docs.github.com/actions/using-workflows/storing-workflow-data-as-artifacts"
                target="_blank"
              >
                Artifacts docs
              </a>
            </li>
            <li>
              <a
                href="https://github.com/actions/upload-artifact"
                target="_blank"
              >
                upload-artifact
              </a>
            </li>
            <li>
              <a
                href="https://github.com/actions/download-artifact"
                target="_blank"
              >
                download-artifact
              </a>
            </li>
          </ul>
        </div>
        <div id="social">
          <svg className="icon" role="presentation" aria-hidden="true">
            <use href="/icons.svg#social-icon"></use>
          </svg>
          <h2>Why artifacts matter</h2>
          <p>Pass data between jobs and keep build output</p>
          <ul>
            <li>
              <a
                href="https://docs.github.com/actions/using-jobs/using-jobs-in-a-workflow"
                target="_blank"
              >
                Share between jobs
              </a>
            </li>
            <li>
              <a
                href="https://docs.github.com/actions/managing-workflow-runs/removing-workflow-artifacts"
                target="_blank"
              >
                Retention &amp; cleanup
              </a>
            </li>
            <li>
              <a
                href="https://docs.github.com/actions/learn-github-actions"
                target="_blank"
              >
                Learn Actions
              </a>
            </li>
          </ul>
        </div>
      </section>

      <div className="ticks"></div>
      <section id="spacer"></section>
    </>
  )
}

export default App
