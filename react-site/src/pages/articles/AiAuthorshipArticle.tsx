import React from 'react';

export const AiAuthorshipArticle: React.FC = () => {
  return (
    <article>
      <h1>I Use AI to Write My Books. I Wrote the First One by Hand.</h1>
      <p><em>Six years, six books, one fantasy world, and a stack of tooling built to stop the machine from drifting. What "AI-assisted" actually looks like when a human directs the whole thing.</em></p>
      <hr />

      <p>A debut novelist recently lost a major book deal after his agents said they could no longer authenticate how the manuscript had been written. I have no idea what that author did or didn't do, and I'm not going to pretend I do. But the argument that followed is one I sit directly inside, so I'd rather say where I stand than let the category swallow me quietly.</p>

      <p>I'm the creator of <strong>The Mirelands</strong>, a dark-fantasy saga I've been building for roughly six years. There are six books in this world.</p>

      <p>And yes: I use AI. I use Claude. I use ChatGPT. I use AI throughout the process.</p>

      <p>So let me ask the question I think we actually need to ask.</p>

      <h2>Does that mean I didn't write the books?</h2>

      <p>If the answer is yes, then I have a second question: could someone else open Claude, type a few prompts, and produce <em>The Mirelands</em> without me?</p>

      <p>Because if the answer to that is supposed to be yes, I would genuinely like to watch it happen.</p>

      <h2>I wrote the first one by hand</h2>

      <p>This is the part that gets flattened when the whole thing is reduced to "AI-written." The first book was handwritten. No model, no prompt, no pipeline. Just the world and me.</p>

      <p>The machinery came later, and it came because I needed it — not because it saved me from writing.</p>

      <h2>What I actually do: I tell the story out loud</h2>

      <p>Here is the honest description of my process, and it's stranger than either side of this argument tends to assume.</p>

      <p><strong>I am a storyteller before I am a typist.</strong> The story arrives as something I speak — scenes, voices, the shape of a chapter, the way a character would actually say a thing. What AI does, once the machinery around it is stable enough to trust, is take what I have spoken as a storyteller and put it into written text. It fixes my grammar. It helps me find a sentence I can hear but can't land. It helps me restructure something that isn't working.</p>

      <p>It does not supply the fantasy. It does not supply the ideas. It transcribes and refines a story that already exists, told by a person who has been carrying it around for years.</p>

      <p>Sometimes it generates material I reject completely. Sometimes it produces something useful that I then rewrite. I'm not hiding any of that.</p>

      <p>But <strong>using a tool does not automatically transfer authorship to the tool.</strong></p>

      <p>If an editor fixes my grammar, did the editor write my novel? If a voice actress performs my character, did she write it? If a composer scores my adaptation, did he write it? If a game engine renders my world, did the engine create it?</p>

      <p>And if an AI helps me generate, revise, transform, verify, or polish parts of the work — at what point does "AI-assisted" suddenly become "AI-authored"?</p>

      <h2>The world came first, and the world is the hard part</h2>

      <p><em>The Mirelands</em> has its own cosmology, history, peoples, kingdoms, characters, creatures, magic, politics, mythology, ecology, chronology, and interconnected storylines.</p>

      <p>It has three moons and two skies.</p>

      <p>The Silver Moon follows its regular cycle. The Green Moon appears twice a month and changes the experience of the world through the interaction of moonlight, plants, insects, and the environment. The Red Moon appears only twice a year, stays for ten days, and brings a completely different biological and psychological horror with it — it changes the behaviour of people and awakens enormous creatures from the swamps.</p>

      <p>Those aren't prompts I threw at a model and then discovered. Those are pieces of a world I have been designing, connecting, and revising for years.</p>

      <p>And the books aren't six unrelated outputs. They sit on the same timeline, seen from different perspectives, with different peoples and factions experiencing the same events from different angles. The lore has to stay consistent across the entire saga.</p>

      <h2>Why I had to build machinery: characters drift</h2>

      <p>This is the failure mode nobody outside the work talks about, and it is the reason my process looks the way it does.</p>

      <p><strong>If you write with an AI, voices drift.</strong> Left alone, every character slowly converges on the same register — the model's own. Brakka starts talking like Synovia. Synovia starts talking like Mirae. The distinctions you spent years building erode one paragraph at a time, and they erode <em>smoothly</em>, so you don't notice until a whole chapter sounds wrong.</p>

      <p>So each character had to be built as a personality that could be held to. And to hold anything to anything across hundreds of thousands of words of interconnected material, I had to build a <strong>RAG-based canon and verification system</strong> — something that checks the books against the world I created and tells me when the world has slipped.</p>

      <p>That system is not a convenience. It is the thing standing between a six-year saga and mush.</p>

      <h2>The other six years</h2>

      <p>When people hear "six years," they picture six years of typing. That isn't what happened.</p>

      <p>I travelled. I spent around €30,000 on studios, studio equipment, and voice actresses and actors, recording real human performance. I curated audio datasets — and wrote <strong>Rust binaries</strong> to do it, because the tooling I needed didn't exist. I trained custom text-to-speech models and built wrappers around them for normalisation and QA. Two of those QA layers became open-source tools in their own right: <a href="/ttsproof/">ttsproof</a> and <a href="/trainproof/">trainproof</a>.</p>

      <p>Then I took the books beyond the books: web games set in the world, additional lore, ebooks and paperbacks, audiobooks, and full dramatized audio adaptations. For the audio productions I went through the books practically scene by scene, turning narrative prose into dialogue and performance — because a novel and an audio drama are not the same object. Narration has to become action, timing, atmosphere, and a voice in a room.</p>

      <p>AI is involved in those processes too. So what exactly are we calling that?</p>

      <h2>"AI-written" is hiding everything that matters</h2>

      <p>There's an enormous difference between:</p>

      <p><em>"I asked a model to write me a fantasy novel and published the result."</em></p>

      <p>and</p>

      <p><em>"I spent six years building a fictional universe, wrote its books, designed its continuity, developed its characters and mythology, directed its adaptations, built games and lore around it, and used AI as a set of tools throughout the creative and production process."</em></p>

      <p>Those are not the same thing, and one bucket cannot hold both.</p>

      <p>Some people use AI to avoid writing. Some use it to write. Some use it as an editor. Some as a brainstorming partner. Some as a production tool. Some build entire creative pipelines around it. Those aren't interchangeable, and "human-written" versus "AI-written" conceals every difference that actually matters.</p>

      <h2>Where I draw the line</h2>

      <p>Writers should be honest about what they use AI for. That's the part I think is genuinely non-negotiable, and it's why this article exists.</p>

      <p>But the conversation also has to be honest about <strong>what the human actually did</strong>.</p>

      <p>If I use AI in my process, does that make six years of work worthless? Did the worldbuilding disappear? Did the characters? Did the six years?</p>

      <p>I didn't wake up one morning and find <em>The Mirelands</em> sitting inside Claude. I built it. The AI became part of the machinery I used to bring it into existence.</p>

      <p>And that's the uncomfortable question underneath all of this: when AI becomes part of an artist's toolkit, are we going to judge the existence of the tool — or are we going to look at the human being who conceived, directed, revised, rejected, connected, built, and ultimately decided what the work became?</p>

      <p>I'm genuinely curious where people draw that line. I'm not offering any of this as proof that AI had no role. Quite the opposite. It's an invitation to look at what an AI-assisted creative project actually looks like when a human has spent years directing the whole thing.</p>

      <h2>The work itself</h2>

      <ul>
        <li><a href="https://tts.bedvibe.studio/the-mirelands/" target="_blank" rel="noopener noreferrer">The Mirelands — the franchise world</a></li>
        <li><a href="https://tts.bedvibe.studio/audiobooks/" target="_blank" rel="noopener noreferrer">Audiobooks and audio dramas</a></li>
        <li><a href="https://tts.bedvibe.studio/games/mirelands/" target="_blank" rel="noopener noreferrer">Interactive games</a></li>
        <li><a href="https://tts.bedvibe.studio/ebooks/" target="_blank" rel="noopener noreferrer">eBooks</a></li>
        <li><a href="https://tts.bedvibe.studio/author/panos-gkilis/" target="_blank" rel="noopener noreferrer">Author page</a></li>
      </ul>
    </article>
  );
};
