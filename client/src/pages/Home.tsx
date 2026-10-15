import { useState } from "react";
import { Link, useLocation } from "wouter";
import { Activity, ArrowRight, ArrowUpRight, Check, Clock3, Heart, Leaf, Target, Trophy, Utensils } from "lucide-react";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

const heroImage = "/manus-storage/forge-bodyweight-hero_4816e974.jpg";
const strengthImage = "/manus-storage/forge-bodyweight-wall_13c145dc.jpg";
const floorImage = "/manus-storage/forge-bodyweight-floor_b538a0da.jpg";
const nutritionImage = "/manus-storage/forge-nutrition_47886e8b.jpg";

export function WorkoutSelector() {
  const [duration, setDuration] = useState(20);
  const [focus, setFocus] = useState<"Strength" | "Full Body" | "Mobility" | "Energy" | "Recovery">("Strength");
  const [level, setLevel] = useState<"Beginner" | "Intermediate" | "Advanced">("Beginner");
  const [workout, setWorkout] = useState<any>(null);
  const recommendation = trpc.forge.recommendation.generate.useMutation({
    onSuccess: setWorkout,
    onError: () => toast.error("We couldn't build that session. Please try again."),
  });
  const [, setLocation] = useLocation();
  const { isAuthenticated } = useAuth();
  const generate = () => recommendation.mutate({ duration, focus, level });
  const start = () => {
    if (!workout) return;
    const route = `/workout/${workout.id}?duration=${duration}&focus=${encodeURIComponent(focus)}&level=${level}`;
    if (!isAuthenticated) {
      window.sessionStorage.setItem("forge.returnAfterAuth", route);
      setLocation(`/login?returnTo=${encodeURIComponent(route)}`);
      return;
    }
    setLocation(route);
  };
  return (
    <div className="workout-tool" id="workout-builder">
      <div className="tool-heading">
        <div><span className="eyebrow">BODYWEIGHT · NO GYM REQUIRED</span><h3>How much time<br />do you have?</h3></div>
        <span className="tool-index">01 / 03</span>
      </div>
      <div className="selector-group">
        <p className="selector-label">Choose your window</p>
        <div className="choice-row" role="group" aria-label="Workout duration">
          {[10, 20, 30, 45, 60].map((value) => <button key={value} className={`choice ${duration === value ? "selected" : ""}`} onClick={() => setDuration(value)} aria-pressed={duration === value}>{value}<small>MIN</small></button>)}
        </div>
      </div>
      <div className="selector-split">
        <label className="field-label">What do you want to work on?
          <select value={focus} onChange={(event) => setFocus(event.target.value as typeof focus)}><option>Strength</option><option>Full Body</option><option>Mobility</option><option>Energy</option><option>Recovery</option></select>
        </label>
        <label className="field-label">What is your experience level?
          <select value={level} onChange={(event) => setLevel(event.target.value as typeof level)}><option>Beginner</option><option>Intermediate</option><option>Advanced</option></select>
        </label>
      </div>
      <p className="equipment-note"><Check size={14} /> Your body, a safe floor and your time are enough. No mat or equipment required.</p>
      <button className="button button-light tool-submit" onClick={generate} disabled={recommendation.isPending}>
        {recommendation.isPending ? "Building your session…" : "Build my session"}<ArrowRight size={16} />
      </button>
      {workout && <div className="workout-result" aria-live="polite">
        <div className="result-top"><span className="eyebrow">YOUR SESSION · NO EQUIPMENT</span><span className="result-duration"><Clock3 size={14} /> {workout.duration} MIN</span></div>
        <h4>{workout.name}</h4>
        <p>{workout.exercises.length} movements · {workout.difficulty} · Equipment: None</p>
        <ol>{workout.exercises.map((exercise: any) => <li key={exercise.slug}>{exercise.name}<span>{exercise.reps}</span></li>)}</ol>
        <button className="button button-outline tool-submit" onClick={start}>Preview & start <ArrowRight size={16} /></button>
        <small className="muted">A flexible bodyweight suggestion—not medical advice. Adjust to what feels right today.</small>
      </div>}
    </div>
  );
}

function CommunityPreview() {
  const posts = trpc.forge.community.posts.useQuery(undefined, { retry: false });
  const support = trpc.forge.community.support.useMutation({ onSuccess: () => posts.refetch() });
  const join = trpc.forge.community.joinChallenge.useMutation({ onSuccess: () => toast.success("You’re in. Make the challenge your own.") });
  const { isAuthenticated } = useAuth();
  const [, setLocation] = useLocation();
  const joinChallenge = () => {
    if (!isAuthenticated) {
      window.sessionStorage.setItem("forge.returnAfterAuth", "/community");
      setLocation("/login?returnTo=%2Fcommunity");
    } else join.mutate({ slug: "small-steps-7" });
  };
  return <section className="section community-section" id="community">
    <div className="community-lead"><span className="eyebrow">BETTER, TOGETHER</span><h2>A supportive community<br /><em>for steady progress.</em></h2><p>A place to notice small wins, keep a gentle promise to yourself, and offer encouragement without comparison.</p><button className="button button-light" onClick={joinChallenge}>{join.isPending ? "Joining…" : "Join the 7-day consistency challenge"}<ArrowRight size={16} /></button><small className="muted">One movement session, walk or stretch each day. Your pace counts.</small></div>
    <div className="community-feed">
      <div className="feed-top"><span className="eyebrow">COMMUNITY NOTES</span><span className="feed-dot" aria-label="Supportive community" /></div>
      {posts.data?.length ? posts.data.slice(0, 3).map((post: any) => <article className="community-post" key={post.id}><span className="post-type">{post.kind === "milestone" ? "A SMALL WIN" : "ENCOURAGEMENT"}</span><p>“{post.content}”</p><div className="post-bottom"><span>{post.name || "FORGE member"}</span><button onClick={() => isAuthenticated ? support.mutate({ id: post.id }) : setLocation("/login")} aria-label="Send support"><Heart size={14} /> {post.supportCount}</button></div></article>) : <div className="feed-empty"><div className="empty-mark">F</div><p>The first note is waiting to be written.</p><span>Share a personal milestone when you’re ready.</span><Link href="/signup" className="text-link">Join the community <ArrowRight size={14} /></Link></div>}
      <Link href="/dashboard" className="text-link community-link">Your space <ArrowUpRight size={14} /></Link>
    </div>
  </section>;
}

export default function Home() {
  return <main>
    <section className="hero" id="home">
      <div className="hero-copy"><span className="eyebrow hero-eyebrow"><i /> WOMEN'S FITNESS & WELLBEING</span>
        <h1>Fitness that<br /><em>fits your life.</em></h1>
        <p>Flexible bodyweight workouts and practical wellbeing support for women, shaped around your schedule and experience.</p>
        <div className="hero-actions"><Link className="button button-light" href="/signup">Get started <ArrowRight size={16} /></Link><a className="button button-quiet" href="#how-it-works">See how it works <span>↓</span></a></div>
        <div className="hero-foot"><span>NO GYM · NO EQUIPMENT</span><span>01 — 04</span></div>
      </div>
      <div className="hero-visual"><img src={heroImage} alt="A woman performing a bodyweight reverse lunge in a clear, quiet studio" fetchPriority="high" />
        <div className="hero-image-wash" />
        <div className="float-card float-card-a"><span className="float-icon"><Clock3 size={14} /></span><div><strong>20 MIN</strong><small>Suggested workout</small></div></div>
        <div className="float-card float-card-b"><span className="float-icon"><Target size={14} /></span><div><strong>STRENGTH</strong><small>Today's focus</small></div></div>
        <div className="visual-caption"><span>01 / TRAIN FOR YOUR LIFE</span><span>NOT JUST THE MIRROR</span></div>
      </div>
      <a className="hero-scroll" href="#why-forge">SCROLL TO EXPLORE <span>↓</span></a>
    </section>

    <section className="section problem-section" id="about">
      <div className="section-kicker"><span className="eyebrow">A DIFFERENT STARTING POINT</span><span className="section-number">01 — THE REALITY</span></div>
      <div className="problem-layout"><h2>A fitness routine should<br /><em>fit your life.</em></h2>
        <div className="problem-copy"><p>Work shifts. Family needs. Different seasons of energy. Advice that changes every week. Real life is complicated—and none of that is a character flaw.</p><p className="strong-line">Your schedule changes.<br />Your training can too.</p><a className="text-link" href="#how-it-works">A more practical approach <ArrowRight size={14} /></a></div>
      </div>
      <div className="reality-strip">{["Limited time", "Work & care", "Changing needs", "Too much noise"].map((item, index) => <div key={item}><span>0{index + 1}</span><p>{item}</p><i>↗</i></div>)}</div>
    </section>

    <section className="section why-section" id="why-forge">
      <div className="section-kicker"><span className="eyebrow">THE FORGE METHOD</span><span className="section-number">02 — BUILT AROUND YOU</span></div>
      <div className="section-title-row"><h2>Fitness built around<br /><em>your routine.</em></h2><p>Good training is not all-or-nothing. It meets you where you are and gives you a useful next step.</p></div>
      <div className="principle-grid">{[
        { icon: Clock3, n: "01", title: "Your time", desc: "How much space do you actually have today? Start there." },
        { icon: Activity, n: "02", title: "Your body", desc: "Training should respect your experience and current needs." },
        { icon: Activity, n: "03", title: "No equipment", desc: "Your body, a safe floor and your time are enough to begin." },
        { icon: Utensils, n: "04", title: "Your food", desc: "Practical choices that belong in a real household." },
        { icon: Target, n: "05", title: "Your consistency", desc: "Notice progress that matters beyond the mirror." },
      ].map(({ icon: Icon, n, title, desc }) => <article className="principle-card" key={n}><div className="principle-top"><Icon size={18} strokeWidth={1.5} /><span>{n}</span></div><h3>{title}</h3><p>{desc}</p><span className="card-arrow">↗</span></article>)}</div>
    </section>

    <section className="section how-section" id="how-it-works">
      <div className="section-kicker"><span className="eyebrow">HOW FORGE WORKS</span><span className="section-number">03 — SMALL STEPS, BUILT WELL</span></div>
      <div className="section-title-row"><h2>A practical way to<br /><em>build healthy habits.</em></h2><p>A considered system for moving, fuelling and noticing how you feel—without another rigid rulebook.</p></div>
      <div className="how-grid">{[
        ["01", "Workouts for your time", "Choose 10, 20, 30, 45 or 60 minutes. Your day sets the size of the session."],
        ["02", "Choose a focus and level", "Pick what you want to work on and the experience level that feels right today."],
        ["03", "Progress without equipment", "Build through repetitions, time, sets, tempo, comfortable range and harder bodyweight variations."],
        ["04", "Food, without homework", "Flexible, familiar meal ideas and protein guidance—no fear or food rules."],
        ["05", "Track what matters", "See training, energy, sleep and movement patterns together."],
        ["06", "Real support", "Celebrate personal milestones and choose challenges at your own pace."],
      ].map(([n, title, body]) => <article className="how-card" key={n}><span className="how-number">{n}</span><div><h3>{title}</h3><p>{body}</p></div><ArrowUpRight size={15} /></article>)}</div>
    </section>

    <section className="program-section section" id="programs">
      <div className="section-kicker"><span className="eyebrow">FIND YOUR STARTING POINT</span><span className="section-number">04 — PROGRAMS</span></div>
      <div className="section-title-row"><h2>Programs for every<br /><em>starting point.</em></h2><Link className="text-link" href="/programs">Explore every program <ArrowRight size={14} /></Link></div>
      <div className="program-grid">{[
        { n: "01", title: "Foundation", tag: "BEGIN HERE", desc: "Build movement confidence with repeatable, well-paced sessions.", mark: "F/01" },
        { n: "02", title: "Strength", tag: "BODYWEIGHT", desc: "Progress through reps, tempo, range and movement variations.", mark: "F/02" },
        { n: "03", title: "Mobility", tag: "MOVE WELL", desc: "Explore comfortable range and move through your day.", mark: "F/03" },
        { n: "04", title: "Life Stage", tag: "ADAPTABLE", desc: "Training options that flex through changing routines.", mark: "F/04" },
      ].map((program) => <Link className="program-card" href={`/programs/${program.title.toLowerCase().replace(" ", "-")}`} key={program.title}><span className="program-tag">{program.tag} <span>{program.n}</span></span><span className="program-mark">{program.mark}</span><h3>{program.title}</h3><p>{program.desc}</p><span className="program-cta">View program <ArrowUpRight size={15} /></span></Link>)}</div>
    </section>

    <section className="selector-section section" id="workouts">
      <div className="selector-intro"><span className="eyebrow">YOUR DAY, YOUR SESSION</span><h2>Choose a workout<br /><em>for the time you have.</em></h2><p>Choose the time, focus and experience level that fit today. Get a complete bodyweight session—no gym, equipment or mat required.</p><div className="selector-reassurance"><Check size={14} /><span>No perfect week required.<br />No guilt if plans change.</span></div></div>
      <WorkoutSelector />
    </section>

    <section className="section exercise-section" id="exercises">
      <div className="section-kicker"><span className="eyebrow">THE MOVEMENT LIBRARY</span><span className="section-number">05 — PRACTICE WITH PURPOSE</span></div>
      <div className="section-title-row"><h2>Bodyweight exercises<br /><em>with clear guidance.</em></h2><Link className="text-link" href="/exercises">Browse all exercises <ArrowRight size={14} /></Link></div>
      <div className="exercise-preview">{[
        { n: "01", name: "Bodyweight squat", group: "QUADS · GLUTES", img: heroImage },
        { n: "02", name: "Incline push-up", group: "CHEST · SHOULDERS", img: strengthImage },
        { n: "03", name: "Bird dog", group: "CORE · CONTROL", img: floorImage },
      ].map((item) => <Link className="exercise-tile" href="/exercises" key={item.n}><div className="exercise-image"><img src={item.img} alt="" loading="lazy" /><span>{item.n}</span></div><div className="exercise-meta"><div><span>{item.group}</span><h3>{item.name}</h3></div><ArrowUpRight size={16} /></div></Link>)}</div>
      <p className="small-note">Clear cues. No equipment. Progress through repetitions, duration, sets, tempo, range and movement difficulty.</p>
    </section>

    <section className="nutrition-feature section" id="nutrition">
      <div className="nutrition-image"><img src={nutritionImage} alt="A practical Indian meal with dal, rice, fresh greens and water" loading="lazy" /><span className="photo-label">FAMILIAR FOOD. FLEXIBLE CHOICES.</span></div>
      <div className="nutrition-copy"><span className="eyebrow">NOURISHMENT, NOT NUMBERS</span><h2>Flexible nutrition<br /><em>for everyday meals.</em></h2><p>Familiar meal ideas with options for real kitchens and budgets. No supplements, specialist foods, strict rules or fear around normal food.</p><div className="nutrition-points"><span><Leaf size={15} /> Familiar ingredients</span><span><Heart size={15} /> Flexible by design</span><span><Utensils size={15} /> Indian food examples</span></div><Link className="button button-outline" href="/nutrition">Explore practical nutrition <ArrowRight size={15} /></Link><small className="muted">Educational guidance, not individual medical nutrition advice.</small></div>
    </section>

    <CommunityPreview />

    <section className="final-cta section"><div className="final-ornament">F</div><span className="eyebrow">CHOOSE YOUR NEXT SESSION</span><h2>Plan your next workout<br /><em>around your day.</em></h2><p>Choose a time, focus and experience level. FORGE builds a flexible bodyweight session for today.</p><Link className="button button-light" href="/signup">Start your FORGE <ArrowRight size={16} /></Link><span className="final-line">PRACTICAL FITNESS, BUILT AROUND YOUR LIFE.</span></section>

    <footer className="site-footer"><div className="footer-brand"><Link href="/" className="wordmark"><span className="forge-symbol">F</span> FORGE</Link><p>Flexible workouts and wellbeing support for women.</p></div><div className="footer-col"><span>EXPLORE</span><Link href="/about">About</Link><Link href="/programs">Programs</Link><Link href="/nutrition">Nutrition</Link><Link href="/exercises">Exercise library</Link></div><div className="footer-col"><span>YOUR ACCOUNT</span><Link href="/login">Log in</Link><Link href="/signup">Create account</Link><Link href="/dashboard">Dashboard</Link></div><div className="footer-col"><span>THE DETAILS</span><Link href="/privacy">Privacy</Link><Link href="/terms">Terms</Link><Link href="/admin/login">Admin</Link></div><div className="footer-bottom"><span>© {new Date().getFullYear()} FORGE. FLEXIBLE FITNESS FOR EVERYDAY LIFE.</span><span>Training, nutrition and progress at your pace.</span></div></footer>
  </main>;
}
