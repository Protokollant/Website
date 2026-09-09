import { useEffect, useRef, useState, memo } from 'react';
import {
  Clock3,
  ChevronRight,
  ChevronLeft,
  Eye,
  MapPin,
  Pause,
  Play,
  SkipBack,
  SkipForward,
  Volume2,
  VolumeX,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { profile, portfolio, leftPortfolio } from './profile';
import {
  Collapsible,
  CollapsibleTrigger,
  CollapsibleContent,
} from '@/components/ui/collapsible';
import { SocialSymbol } from './symbols';
import { attachTilt } from './tilt';
import { Works } from './works';
import { DiscordPresence } from './discord-presence';
import { useDiscordPresence } from './discord-context';

function formatTime(value: number) {
  if (!Number.isFinite(value)) return '0:00';
  return `${Math.floor(value / 60)}:${String(Math.floor(value % 60)).padStart(2, '0')}`;
}

const ClockWidget = memo(function ClockWidget() {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const timer = window.setInterval(() => setNow(new Date()), 1000);
    return () => window.clearInterval(timer);
  }, []);
  const time = new Intl.DateTimeFormat('en-GB', {
    timeZone: profile.timezone,
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  }).format(now);
  const [hours, minutes, seconds] = time.split(':').map(Number);
  const date = new Intl.DateTimeFormat('en-US', {
    timeZone: profile.timezone,
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  }).format(now);
  const zone = new Intl.DateTimeFormat('en', {
    timeZone: profile.timezone,
    timeZoneName: 'shortOffset',
  })
    .formatToParts(now)
    .find((part) => part.type === 'timeZoneName')?.value;
  const ownZone = new Intl.DateTimeFormat().resolvedOptions().timeZone;
  return (
    <section
      className="widget clock-widget"
      aria-label={`Local time ${time}, ${profile.timezone}`}
    >
      <div className="clock-face" aria-hidden="true">
        {Array.from({ length: 60 }, (_, index) => (
          <i
            className={index % 5 === 0 ? 'hour-tick' : ''}
            key={index}
            style={{ transform: `rotate(${index * 6}deg)` }}
          />
        ))}
        <span
          className="hand hour-hand"
          style={{ transform: `rotate(${hours * 30 + minutes / 2}deg)` }}
        />
        <span
          className="hand minute-hand"
          style={{ transform: `rotate(${minutes * 6 + seconds / 10}deg)` }}
        />
        <span
          className="hand second-hand"
          style={{ transform: `rotate(${seconds * 6}deg)` }}
        />
        <span className="clock-pin" />
      </div>
      <span className="timezone-label">
        <Clock3 size={12} /> Timezone
      </span>
      <div className="clock-copy">
        <strong>{time}</strong>
        <span>
          {date} · {zone}
        </span>
        <small>
          {ownZone === profile.timezone
            ? 'Same timezone as you'
            : profile.timezone.replaceAll('_', ' ')}
        </small>
      </div>
    </section>
  );
});

const TypedBio = memo(function TypedBio() {
  const [text, setText] = useState(
    profile.effects.typing ? '' : profile.phrases[0] || profile.bio,
  );
  useEffect(() => {
    if (!profile.effects.typing || !profile.phrases.length) return;
    let phraseIndex = 0;
    let character = 0;
    let deleting = false;
    let timer: number;
    function tick() {
      const phrase = profile.phrases[phraseIndex];
      character += deleting ? -1 : 1;
      setText(phrase.slice(0, character));
      let delay = deleting ? 70 : 110;
      if (character === 0) {
        deleting = false;
        phraseIndex = (phraseIndex + 1) % profile.phrases.length;
        delay = 350;
      } else if (character === phrase.length && !deleting) {
        deleting = true;
        delay = 1800;
      }
      timer = window.setTimeout(tick, delay);
    }
    timer = window.setTimeout(tick, 150);
    return () => window.clearTimeout(timer);
  }, []);
  return (
    <p className="bio" aria-label={profile.phrases.join(' · ')}>
      <span aria-hidden="true">
        {text}
        <span className="cursor">|</span>
      </span>
    </p>
  );
});

export default function Home() {
  const discordState = useDiscordPresence();
  const presence = discordState.kind === 'live' ? discordState.presence : null;
  const identity =
    presence ??
    (discordState.kind === 'live' ? undefined : discordState.cachedPresence);
  const displayName =
    profile.discord.syncIdentity && identity ? identity.name : profile.name;
  const displayAvatar =
    profile.discord.syncIdentity && identity ? identity.avatar : profile.avatar;
  const [entered, setEntered] = useState(!profile.intro.enabled);
  const [leftOpen, setLeftOpen] = useState(false);
  const leftTriggerRef = useRef<HTMLButtonElement>(null);
  const leftSurfaceRef = useRef<HTMLDivElement>(null);
  const leftStageRef = useRef<HTMLDivElement>(null);
  const [worksOpen, setWorksOpen] = useState(false);
  const worksTriggerRef = useRef<HTMLButtonElement>(null);
  const [tiltEnabled, setTiltEnabled] = useState(profile.effects.tilt);
  const [playing, setPlaying] = useState(false);
  const [trackIndex, setTrackIndex] = useState(0);
  const [elapsed, setElapsed] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(profile.music.volume);
  const [muted, setMuted] = useState(false);
  const [entryLeaving, setEntryLeaving] = useState(false);
  const [error, setError] = useState('');
  const audioRef = useRef<HTMLAudioElement>(null);
  const profileRef = useRef<HTMLHeadingElement>(null);
  const profileSurfaceRef = useRef<HTMLDivElement>(null);
  const worksSurfaceRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const worksStageRef = useRef<HTMLDivElement>(null);
  const track = profile.music.tracks[trackIndex];
  const hasMusic = profile.music.enabled && Boolean(track);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume;
      audioRef.current.muted = muted;
    }
  }, [volume, muted]);

  useEffect(() => {
    if (!entered || !audioRef.current) return;
    const audio = audioRef.current;
    audio.load();
  }, [entered, trackIndex]);

  async function playAudio() {
    if (!audioRef.current) return;
    try {
      await audioRef.current.play();
      setError('');
    } catch {
      setError('Audio could not play. Press play to retry.');
    }
  }

  function enter() {
    setEntryLeaving(true);
    window.setTimeout(() => setEntered(true), 350);
    requestAnimationFrame(() => profileRef.current?.focus());
  }

  function changeTrack(direction: number) {
    const next =
      (trackIndex + direction + profile.music.tracks.length) %
      profile.music.tracks.length;
    setTrackIndex(next);
    setElapsed(0);
    setDuration(0);
  }

  useEffect(() => {
    if (
      !entered ||
      !tiltEnabled ||
      !stageRef.current ||
      !profileSurfaceRef.current
    )
      return;
    const cleanups = [attachTilt(stageRef.current, profileSurfaceRef.current)];
    if (worksOpen && worksStageRef.current && worksSurfaceRef.current) {
      cleanups.push(attachTilt(worksStageRef.current, worksSurfaceRef.current));
    }
    if (leftOpen && leftStageRef.current && leftSurfaceRef.current) {
      cleanups.push(attachTilt(leftStageRef.current, leftSurfaceRef.current));
    }
    return () => {
      for (const cleanup of cleanups) cleanup();
    };
  }, [entered, tiltEnabled, worksOpen, leftOpen]);

  return (
    <main className={`site ${profile.effects.glow ? 'with-glow' : ''}`}>
      {entered && (
        <button
          className="tilt-control"
          aria-pressed={tiltEnabled}
          onClick={() => setTiltEnabled(!tiltEnabled)}
        >
          Tilt {tiltEnabled ? 'on' : 'off'}
        </button>
      )}
      {hasMusic && (
        <audio
          ref={audioRef}
          src={track.src}
          preload="metadata"
          onPlay={() => setPlaying(true)}
          onPause={() => setPlaying(false)}
          onTimeUpdate={(event) => setElapsed(event.currentTarget.currentTime)}
          onLoadedMetadata={(event) =>
            setDuration(event.currentTarget.duration)
          }
          onCanPlay={() => {
            if (entered && profile.music.autoplayOnEntry) void playAudio();
          }}
          onEnded={() => changeTrack(1)}
          onError={() => {
            setPlaying(false);
            setError('Track unavailable. Check the configured audio file.');
          }}
        >
          <track
            kind="captions"
            src={track.captions}
            srcLang="en"
            label="English"
          />
        </audio>
      )}
      {!entered ? (
        <Button
          className={`entry-screen ${entryLeaving ? 'is-leaving' : ''}`}
          onClick={enter}
          disabled={entryLeaving}
        >
          {profile.intro.text}
        </Button>
      ) : (
        <Collapsible
          className="profile-shell profile-entering"
          open={worksOpen}
          onOpenChange={(open) => {
            setWorksOpen(open);
            if (open) setLeftOpen(false);
          }}
          data-works-open={worksOpen}
          data-left-open={leftOpen}
          onKeyDown={(event) => {
            if (event.key === 'Escape' && leftOpen) {
              setLeftOpen(false);
              leftTriggerRef.current?.focus();
            }
            if (event.key === 'Escape' && worksOpen) {
              setWorksOpen(false);
              worksTriggerRef.current?.focus();
            }
          }}
        >
          <div className="perspective" ref={profileSurfaceRef}>
            <div className="stage" ref={stageRef}>
              <article className="profile-panel">
                <header className="identity">
                  <div className="identity-avatar">
                    {displayAvatar ? (
                      <img className="avatar" src={displayAvatar} alt="" />
                    ) : (
                      <div
                        className="avatar identity-fallback"
                        aria-hidden="true"
                      >
                        <SocialSymbol name="discord" />
                      </div>
                    )}
                    <span
                      className={`avatar-status status-dot status-${presence?.status || 'unknown'}`}
                      aria-hidden="true"
                    />
                  </div>
                  <div className="identity-copy">
                    <div className="name-line">
                      <h1 tabIndex={-1} ref={profileRef}>
                        {displayName}
                      </h1>
                      <span
                        className="verified-badge"
                        tabIndex={0}
                        aria-label="Verified"
                      >
                        <img src="/badges/Verified.jpg" alt="" />
                        <span className="verified-tooltip" role="tooltip">
                          Verified
                        </span>
                      </span>
                      <span
                        className="verified-badge"
                        tabIndex={0}
                        aria-label="Verified"
                      >
                        <img src="/badges/Moneybag.jpg" alt="" />
                        <span className="verified-tooltip" role="tooltip">
                          $$$
                        </span>
                      </span>
                    </div>
                    <TypedBio />
                    <DiscordPresence />
                  </div>
                </header>
                <div className="widgets">
                  <ClockWidget />
                </div>
                <div className="profile-actions">
                  <nav className="socials" aria-label="Social links">
                    {profile.socials.map((social) => (
                      <a
                        key={social.label}
                        href={social.url}
                        aria-label={social.label}
                        title={social.label}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <SocialSymbol name={social.icon} />
                      </a>
                    ))}
                  </nav>
                </div>
                <footer className="profile-footer">
                  {profile.viewCount !== null && (
                    <>
                      <span title="Reference snapshot — not a live visitor count">
                        <Eye size={17} strokeWidth={3} />
                        {profile.viewCount.toLocaleString('en-US')}
                      </span>
                      <span className="divider">|</span>
                    </>
                  )}
                  {profile.location && (
                    <span>
                      <MapPin size={17} fill="currentColor" stroke="#fff" />
                      <span>{profile.location}</span>
                    </span>
                  )}
                </footer>
              </article>
              {hasMusic && (
                <section className="player" aria-label="Music player">
                  {track.cover ? (
                    <img className="cover" src={track.cover} alt="" />
                  ) : (
                    <div className="cover" aria-hidden="true">
                      <span>
                        AFTER
                        <br />
                        HOURS
                      </span>
                    </div>
                  )}
                  <div className="player-content">
                    <strong className="track-title">{track.title}</strong>
                    <div className="player-row">
                      <span>{formatTime(elapsed)}</span>
                      <input
                        className="seek"
                        aria-label="Track position"
                        type="range"
                        min="0"
                        max={duration || 1}
                        step="0.1"
                        value={elapsed}
                        disabled={!duration}
                        style={{
                          background: `linear-gradient(to right, #fff ${duration ? (elapsed / duration) * 100 : 0}%, #606060 0%)`,
                        }}
                        onChange={(event) => {
                          const time = Number(event.target.value);
                          if (audioRef.current)
                            audioRef.current.currentTime = time;
                          setElapsed(time);
                        }}
                      />
                      <span>{formatTime(duration)}</span>
                      <div className="transport">
                        <Button
                          variant="ghost"
                          className="transport-button skip"
                          aria-label="Previous track"
                          onClick={() => changeTrack(-1)}
                        >
                          <SkipBack fill="currentColor" />
                        </Button>
                        <Button
                          variant="ghost"
                          className="transport-button"
                          aria-label={playing ? 'Pause music' : 'Play music'}
                          onClick={() => {
                            if (playing) audioRef.current?.pause();
                            else void playAudio();
                          }}
                        >
                          {playing ? (
                            <Pause fill="currentColor" />
                          ) : (
                            <Play fill="currentColor" />
                          )}
                        </Button>
                        <Button
                          variant="ghost"
                          className="transport-button skip"
                          aria-label="Next track"
                          onClick={() => changeTrack(1)}
                        >
                          <SkipForward fill="currentColor" />
                        </Button>
                      </div>
                    </div>
                  </div>
                  <label className="volume-row">
                    <span>Volume</span>
                    <input
                      className="volume-control"
                      aria-label="Volume"
                      type="range"
                      min="0"
                      max="1"
                      step="0.01"
                      value={volume}
                      style={{
                        background: `linear-gradient(to right, #fff ${volume * 100}%, #606060 0%)`,
                      }}
                      onChange={(event) =>
                        setVolume(Number(event.target.value))
                      }
                    />
                    <span>{Math.round(volume * 100)}%</span>
                    <Button
                      variant="ghost"
                      className="volume-mute"
                      aria-label={muted ? 'Unmute music' : 'Mute music'}
                      aria-pressed={muted}
                      onClick={() => setMuted((value) => !value)}
                    >
                      {muted ? <VolumeX /> : <Volume2 />}
                    </Button>
                  </label>
                  {error && <output className="audio-error">{error}</output>}
                </section>
              )}
              {profile.games.enabled && profile.games.items.length > 0 && (
                <section className="games-box" aria-label={profile.games.title}>
                  <div className="games-heading">
                    <h2>{profile.games.title}</h2>
                  </div>
                  <div className="games-list">
                    {profile.games.items.map((game) => (
                      <article className="game-card" key={game.title}>
                        {game.image && (
                          <a
                            className="game-image-link"
                            href={game.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            aria-label={`Open ${game.title} website`}
                          >
                            <img
                              className="game-image"
                              src={game.image}
                              alt=""
                              loading="lazy"
                            />
                          </a>
                        )}
                        <span
                          className={`game-status status-${game.status[0].toLowerCase()}`}
                        >
                          {game.status}
                        </span>
                        <div className="game-copy">
                          <strong>{game.title}</strong>
                          <span className="game-hours">
                            <Clock3 size={13} aria-hidden="true" />
                            {game.hours}
                          </span>
                        </div>
                      </article>
                    ))}
                  </div>
                </section>
              )}
            </div>
          </div>
          {portfolio.enabled && (
            <CollapsibleTrigger
              ref={worksTriggerRef}
              className="works-toggle"
              aria-label={
                worksOpen ? 'Meine Werke schließen' : 'Meine Werke öffnen'
              }
              title={worksOpen ? 'Meine Werke schließen' : 'Meine Werke öffnen'}
            >
              <ChevronRight size={30} aria-hidden="true" />
            </CollapsibleTrigger>
          )}
          {portfolio.enabled && (
            <CollapsibleContent
              className="works-reveal"
              ref={worksSurfaceRef}
              keepMounted
            >
              <div className="works-stage" ref={worksStageRef}>
                <button
                  className="works-close"
                  aria-label="Meine Werke schließen"
                  onClick={() => {
                    setWorksOpen(false);
                    worksTriggerRef.current?.focus();
                  }}
                >
                  &times;
                </button>
                <Works />
              </div>
            </CollapsibleContent>
          )}

          {leftPortfolio.enabled && (
            <Collapsible
              className="left-panel-root"
              open={leftOpen}
              onOpenChange={(open) => {
                setLeftOpen(open);
                if (open) setWorksOpen(false);
              }}
            >
              <CollapsibleTrigger
                ref={leftTriggerRef}
                className="works-toggle left-toggle"
                aria-label={
                  leftOpen
                    ? 'Weitere Projekte schliessen'
                    : 'Weitere Projekte oeffnen'
                }
                title={leftPortfolio.title}
              >
                <ChevronLeft size={30} aria-hidden="true" />
              </CollapsibleTrigger>
              <CollapsibleContent
                className="works-reveal left-reveal"
                ref={leftSurfaceRef}
                keepMounted
              >
                <div className="works-stage" ref={leftStageRef}>
                  <button
                    className="works-close"
                    aria-label="Weitere Projekte schliessen"
                    onClick={() => {
                      setLeftOpen(false);
                      leftTriggerRef.current?.focus();
                    }}
                  >
                    &times;
                  </button>
                  <Works collection={leftPortfolio} />
                </div>
              </CollapsibleContent>
            </Collapsible>
          )}
        </Collapsible>
      )}
    </main>
  );
}
