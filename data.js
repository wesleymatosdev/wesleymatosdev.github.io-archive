// hire-site data — vendored static so the site previews over file:// (no fetch).
// Facts verified 2026-09-11: repo counts from oss-site/data/projects.json,
// upstream PRs from the GitHub search API (author wesleymatosdev),
// fleet numbers from zcode-axi/fleet/README.md.
window.HIRE_DATA = {
  proof: [
    {
      icon: 'robot',
      name: 'fleet-v2',
      kind: 'AGENT ORCHESTRATION',
      desc: 'A Hermes-coordinated fleet of coding agents in named tmux windows — spawn, push-wake wait, steer, watchdog, scale-to-zero archive. This site was built by one of its workers.',
      link: 'https://github.com/wesleymatosdev/zcode-axi',
      linkLabel: 'github.com/wesleymatosdev/zcode-axi',
      tags: ['multi-harness', 'file pub/sub', '24/7']
    },
    {
      icon: 'bolt',
      name: 'fleet-bus',
      kind: 'PUSH WAKE LAYER',
      desc: 'Notification bus under the fleet: status files stay the durable record, the bus only wakes. Measured sub-millisecond loopback wake; falls back to polling, loudly, never silently.',
      link: null,
      linkLabel: 'private · wake measured in µs',
      tags: ['busd', 'notifyd', 'sub-1ms']
    },
    {
      icon: 'shield',
      name: 'no-mistakes',
      kind: 'QUALITY GATE',
      desc: 'Pre-ship pipeline an agent runs before code reaches the target: automated review, tests, lint, docs, push, PR, CI — with an adversarial second agent on every diff.',
      link: null,
      linkLabel: 'local · runs on every fleet diff',
      tags: ['review gates', 'CI', 'zero-drift']
    },
    {
      icon: 'brain',
      name: 'gbrain',
      kind: 'MEMORY OS',
      desc: 'Memory for AI systems with a longer horizon — facts keep their source, confidence, and links, instead of dissolving into one MEMORY.md file.',
      link: 'https://demo.wesleymatos.dev/gbrain/',
      linkLabel: 'demo.wesleymatos.dev/gbrain',
      tags: ['memory graph', 'recall', 'local-first']
    },
    {
      icon: 'globe',
      name: 'oss-site',
      kind: 'PUBLIC CATALOG',
      desc: 'A collector + catalog of 72 open-source projects across 8 groups — regenerated from the GitHub API and a local walk of the workspace by a deterministic script.',
      link: 'https://github.com/wesleymatosdev/oss-site',
      linkLabel: 'github.com/wesleymatosdev/oss-site',
      tags: ['72 projects', 'collect.py', 'llms.txt']
    },
    {
      icon: 'magnifier',
      name: 'unfit',
      kind: 'VISUAL REVIEW HUB',
      desc: 'Click-to-annotate review for web artifacts — element-scoped feedback, queued comments, durable SQLite. The review loop his agents ship through.',
      link: 'https://github.com/wesleymatosdev/unfit',
      linkLabel: 'github.com/wesleymatosdev/unfit',
      tags: ['annotation', 'LAN-first', 'review loop']
    },
    {
      icon: 'star',
      name: 'xcap',
      kind: 'UPSTREAM · 3 MERGED PRs',
      desc: 'Rust screen-capture library. Three merged upstream PRs: real-time is_focused on macOS, quieter error paths, dynamic focus values.',
      link: 'https://github.com/nashaofu/xcap/pulls?q=is%3Apr+author%3Awesleymatosdev',
      linkLabel: 'PRs #206 · #195 · #191 merged',
      tags: ['rust', 'macos', 'upstream']
    },
    {
      icon: 'terminal',
      name: 'zcode-cli',
      kind: 'UPSTREAM · MERGED',
      desc: 'Number-key quick-select in choice dialogs, merged upstream. A TUI permission-classifier PR follows the same thread of making agent permission prompts faster and safer.',
      link: 'https://github.com/kingsword09/zcode-cli/pull/136',
      linkLabel: 'PR #136 merged',
      tags: ['tui', 'ux', 'upstream']
    },
    {
      icon: 'house',
      name: 'wesleymatos.dev',
      kind: 'MAIN SITE',
      desc: 'The current main site: a black-hole nebula intro rendered on canvas, console easter eggs, geo-aware copy. This page is its successor.',
      link: 'https://github.com/wesleymatosdev/website',
      linkLabel: 'github.com/wesleymatosdev/website',
      tags: ['canvas', 'starfield', 'i18n']
    }
  ],

  experience: [
    {
      years: '2022',
      title: 'Foundations',
      icon: 'book',
      lines: [
        'Polyglot fundamentals in public: Java, Go, TypeScript, C.',
        'Distributed systems by doing — Kafka consumers, WebRTC calls, REST APIs, blockchain internals.'
      ]
    },
    {
      years: '2023 – 2024',
      title: 'Systems',
      icon: 'wrench',
      lines: [
        'Rust and Go deep work: performance, WASM boundaries, sharp CLI tools.',
        'Backend throughput contests (rinha de backend) — measuring instead of guessing.'
      ]
    },
    {
      years: '2025',
      title: 'Product & upstream',
      icon: 'globe',
      lines: [
        'Full-stack product work: an exam simulator, client sites, review tooling.',
        'Ten upstream PRs merged across xcap, permitio/docs, zio-json and friends.'
      ]
    },
    {
      years: '2026',
      title: 'AI-fleet orchestrator',
      icon: 'robot',
      lines: [
        'Senior full-stack → tech lead → orchestrator: now a fleet of coding agents ships the backlog.',
        'Built the loop end to end — spawn, push-wake, adversarial review gates, watchdogs, archives.'
      ]
    }
  ],

  now: [
    {
      icon: 'robot',
      title: 'Fleet infrastructure',
      status: 'IN PRODUCTION',
      live: true,
      desc: 'Multi-harness worker fleet (ZCode, Codex, Claude, Ollama lanes) with push-wake coordination, cost-window routing and watchdogs.'
    },
    {
      icon: 'orbit',
      title: 'AO / Orca supervision layers',
      status: 'ACTIVE',
      live: true,
      desc: 'Evaluating agent orchestrators (Agent Orchestrator, stablyai/orca) and building supervision on top — including a zcode agent entry contributed to Orca.'
    },
    {
      icon: 'brain',
      title: 'gbrain — memory OS',
      status: 'BUILDING',
      live: false,
      desc: 'Long-horizon memory for AI systems: sourced facts, confidence scoring, linked recall. Spec measured against a live instance.'
    },
    {
      icon: 'star',
      title: 'Upstream contributions',
      status: 'ONGOING',
      live: false,
      desc: 'zcode-cli TUI features merged; security-classifier PR in flight; stablyai/orca zcode agent entry prepared for upstream.'
    }
  ],

  numbers: [
    { value: 72, label: 'OSS projects shipped', suffix: '' },
    { value: 7, label: 'agent harnesses routed', suffix: '' },
    { value: 10, label: 'upstream PRs merged', suffix: '' },
    { value: 1, label: 'ms-class bus wake', prefix: '<', suffix: '' },
    { value: 24, label: 'autonomous pipeline', suffix: '/7' },
    { value: 4, label: 'years shipping in public', suffix: '' }
  ],

  ticker: [
    'fleet-hire-site: working: rendering pixel scenes, console clean',
    'coordinator: fleet-spawn hire-site → zcode lane → ready in 42s',
    'fleet-oss-catalog: ready-for-review: 72 projects indexed across 8 groups',
    'fleet-reviewer: working: adversarial pass on diff — 2 findings, 1 fixed',
    'fleet-watchdog: ok: all worker pids alive',
    'fleet-bus: sub-ms wake verified on loopback',
    'coordinator: fleet-complete oss-site done "catalog deployed, links verified"',
    'fleet-notifyd: pushed spawn/dispatch events to topic'
  ],

  links: {
    email: 'wesleymatosdev@gmail.com',
    github: 'https://github.com/wesleymatosdev',
    blog: 'https://blog.wesleymatos.dev',
    main: 'https://wesleymatos.dev',
    skills: 'https://skills.wesleymatos.dev'
  }
};
