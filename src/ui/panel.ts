import { DEFAULT_FIRMNESS, DEFAULT_DAMPING } from '../physics/settings.ts';
export const element=<T extends HTMLElement>(selector:string)=>document.querySelector<T>(selector)!;
export function mountPanel() {
  element('#app').innerHTML=`
    <header class="masthead"><span>月鹿 · 甜点实验室 <i>/</i> 猫咪牛奶布丁 01</span><span id="gpu-status" class="status"><b></b> 准备中</span></header>
    <section class="intro" aria-labelledby="title"><h1 id="title">Milk &amp;<br><em>meow.</em></h1><p>一口牛奶，一点喵。<br>戳一下，快乐就晃起来。</p></section>
    <main id="stage" aria-label="Interactive pudding"><canvas id="scene" aria-label="Drag the pudding to stretch it, or switch to the spoon and press to scoop a bite. Use the nudge and Take a bite buttons for keyboard alternatives."></canvas><div id="scene-message" role="status">小猫正在准备登场<span></span></div><button id="retry" hidden>再试一次</button></main>
    <section class="caption"><p>戳一戳 · 拉一拉 · 松开看它晃</p><span>不用赶时间，让快乐多弹一会儿。</span><a class="discover-controls" href="#play-controls">调调手感 · 试试小勺子 ↓</a><div class="readings"><div><output id="volume">100.0%</output><small>体积保持</small></div><div><output id="motion">0.00</output><small>晃动能量</small></div><div><output id="eaten">0%</output><small>已尝一口</small></div><div><output id="state">慢慢落下</output><small>此刻状态</small></div></div></section>
    <aside id="play-controls" class="controls" aria-label="Pudding controls">
      <div class="panel-heading"><h2>今日份软甜</h2><span id="flavor-number">01 / 03</span></div>
      <div class="flavors" role="group" aria-label="Flavor"><button data-flavor="vanilla" aria-pressed="true"><i></i>牛奶</button><button data-flavor="berry" aria-pressed="false"><i></i>草莓</button><button data-flavor="matcha" aria-pressed="false"><i></i>抹茶</button></div>
      <div class="play-heading">选个玩法 <span>点一下试试</span></div>
      <div class="tools" role="group" aria-label="选择玩法"><button id="tool-grab" data-tool="grab" aria-pressed="true"><strong>捏一捏</strong><small>按住拖动 · 松手回弹</small></button><button id="tool-spoon" data-tool="spoon" aria-pressed="false"><strong>小勺子</strong><small>用勺子挖走一小块</small></button></div>
      <p id="tool-hint" class="tool-hint" aria-live="polite">按住猫咪拖一拖，松手看它弹回来。</p>
      <button id="bite" class="bite-button"><strong>尝一口</strong><span>点一下，自动挖一勺 ↗</span></button>
      <div class="tuning"><div class="play-heading">调调手感 <span>左右拖动圆点</span></div>
      <label class="slider-label" for="firmness">弹性 <output id="firmness-value">${DEFAULT_FIRMNESS} / 100</output></label><input id="firmness" type="range" min="0" max="100" value="${DEFAULT_FIRMNESS}" aria-describedby="firmness-hint"><div id="firmness-hint" class="range-ends"><span>软糯</span><span>Q 弹</span></div>
      <label class="slider-label" for="damping">回弹收敛 <output id="damping-value">${DEFAULT_DAMPING} / 100</output></label><input id="damping" type="range" min="0" max="100" value="${DEFAULT_DAMPING}" aria-describedby="damping-hint"><div id="damping-hint" class="range-ends"><span>多晃一会</span><span>更快停稳</span></div></div>
      <button id="squish" class="squish">按下去，再弹起来 ↓</button><div class="actions"><button id="nudge">晃一晃 <span>↗</span></button><button id="reset">复原</button></div>
      <div class="toggles"><label><input id="slow" type="checkbox">慢动作</label><label><input id="mesh" type="checkbox">看网格</label><button id="pause" aria-pressed="false">暂停</button></div>
      <details id="about"><summary>关于这块布丁 <span>+</span></summary><p>按住猫咪拖动，身体和小猫脸会一起变形。松开后，看它慢慢弹回来。</p><p>体积约束让布丁在挤压时保留饱满感。调节弹性和回弹收敛，可以找到喜欢的手感。</p><p>小勺子会挖走真实的一小块；点击复原，猫咪就完整回来。</p><small>THREE.JS · WEBGPU · XPBD</small><a href="?inspect=1" class="inspect-link">Open rendering diagnostics ↗</a></details>
    </aside>
    <footer>月鹿的布丁 · 随手捏一捏 <span>把日子过得软一点。</span></footer>
    <button id="inspector-toggle" hidden>Diagnostics</button><section id="diagnostics" hidden aria-label="Rendering diagnostics"><h2>Rendering diagnostics</h2><pre id="device-info"></pre><button id="benchmark">Record 60 seconds</button><output id="benchmark-status">Ready</output><pre id="benchmark-result"></pre><button id="compression-check">Hold 30% compression</button><button id="release-check">Release test grip</button><pre id="physics-info"></pre></section>`;
}
