import { useState, useEffect, useRef } from 'react';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface JoinSessionProps {
  sessionId: string;
  onBack: () => void;
}

export const JoinSession = ({ sessionId, onBack }: JoinSessionProps) => {
  const [jitsiApi, setJitsiApi] = useState<any>(null);
  const jitsiContainer = useRef<HTMLDivElement>(null);

  // Initialize Jitsi Meet automatically when component loads
  useEffect(() => {
    const initializeJitsi = () => {
      if (typeof window !== 'undefined' && (window as any).JitsiMeetExternalAPI && jitsiContainer.current) {
        const roomName = `vpaas-magic-cookie-33efea029781448088cb08c821f698b8/DebatePractice-${sessionId}`;
        
        const api = new (window as any).JitsiMeetExternalAPI("8x8.vc", {
          roomName,
          parentNode: jitsiContainer.current,
          width: '100%',
          height: '100%',
          configOverwrite: {
            startWithAudioMuted: false,
            startWithVideoMuted: false,
            prejoinPageEnabled: false,
          },
          interfaceConfigOverwrite: {
            TOOLBAR_BUTTONS: [
              'microphone', 'camera', 'closedcaptions', 'desktop', 'fullscreen',
              'fodeviceselection', 'hangup', 'profile', 'chat', 'recording',
              'livestreaming', 'etherpad', 'sharedvideo', 'settings', 'raisehand',
              'videoquality', 'filmstrip', 'invite', 'feedback', 'stats', 'shortcuts',
              'tileview', 'videobackgroundblur', 'download', 'help', 'mute-everyone'
            ],
          },
          jwt: "eyJraWQiOiJ2cGFhcy1tYWdpYy1jb29raWUtMzNlZmVhMDI5NzgxNDQ4MDg4Y2IwOGM4MjFmNjk4YjgvOWNkMGZmLVNBTVBMRV9BUFAiLCJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiJ9.eyJhdWQiOiJqaXRzaSIsImlzcyI6ImNoYXQiLCJpYXQiOjE3NTM4MDAyODAsImV4cCI6MTc1MzgwNzQ4MCwibmJmIjoxNzUzODAwMjc1LCJzdWIiOiJ2cGFhcy1tYWdpYy1jb29raWUtMzNlZmVhMDI5NzgxNDQ4MDg4Y2IwOGM4MjFmNjk4YjgiLCJjb250ZXh0Ijp7ImZlYXR1cmVzIjp7ImxpdmVzdHJlYW1pbmciOmZhbHNlLCJmaWxlLXVwbG9hZCI6ZmFsc2UsIm91dGJvdW5kLWNhbGwiOmZhbHNlLCJzaXAtb3V0Ym91bmQtY2FsbCI6ZmFsc2UsInRyYW5zY3JpcHRpb24iOmZhbHNlLCJsaXN0LXZpc2l0b3JzIjpmYWxzZSwicmVjb3JkaW5nIjpmYWxzZSwiZmxpcCI6ZmFsc2V9LCJ1c2VyIjp7ImhpZGRlbi1mcm9tLXJlY29yZGVyIjpmYWxzZSwibW9kZXJhdG9yIjp0cnVlLCJuYW1lIjoiVGVzdCBVc2VyIiwiaWQiOiJnb29nbGUtb2F1dGgyfDEwNjgxMDQyNjc0MjIyMjA0NTc2MCIsImF2YXRhciI6IiIsImVtYWlsIjoidGVzdC51c2VyQGNvbXBhbnkuY29tIn19LCJyb29tIjoiKiJ9.xZO1AyUQY9ZQm8-sxTXfsHzbhunb3NA4zB9FrQaCTziggkFd-82yOeOrIcFYhwuRe6zu3EgIK7bZI1nHpLcUXDd2QvomKKvPZrC4q9TLncO01n3IwiNb9uTE9X_rGYf7Rb8CESyTA1s9key_qBy3mW2JS9P-3wt5Ob5mrE3dMWGf88WqLWWZYRJmPqlM83RaNfazpFjvKJIfKebsakIZTjNlRnELHIZm8AgwtMi50mpiR0xwouRzFRu2g56oDQu7e8VP7H1kEfyExgXMjh6Fv6fPHnMFV-hvb6RW0PqmN9olhaT1iBMHqdoXnIrNmr_4enByDdafDyY3DcinSw4DQQ"
        });

        setJitsiApi(api);

        // Handle participant events
        api.addEventListener('participantJoined', (participant: any) => {
          console.log('Participant joined:', participant);
        });

        api.addEventListener('participantLeft', (participant: any) => {
          console.log('Participant left:', participant);
        });

        // Handle when user leaves the meeting
        api.addEventListener('videoConferenceLeft', () => {
          console.log('User left the conference');
          onBack();
        });
      }
    };

    // Small delay to ensure the container is rendered
    setTimeout(initializeJitsi, 100);

    return () => {
      if (jitsiApi) {
        jitsiApi.dispose();
        setJitsiApi(null);
      }
    };
  }, [sessionId, onBack]);

  return (
    <div className="h-screen flex flex-col bg-black">
      {/* Header with back button */}
      <div className="absolute top-4 left-4 z-10">
        <Button
          variant="secondary"
          onClick={onBack}
          className="flex items-center space-x-2 bg-white/90 hover:bg-white text-black"
        >
          <ArrowLeft size={20} />
          <span>Leave Session</span>
        </Button>
      </div>

      {/* Full-screen video conference */}
      <div 
        ref={jitsiContainer}
        className="flex-1 w-full h-full"
      />
    </div>
  );
};