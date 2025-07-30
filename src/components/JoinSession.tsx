import { useState, useEffect, useRef } from 'react';
import { ArrowLeft, Crown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';

interface JoinSessionProps {
  sessionId: string;
  onBack: () => void;
  isHost?: boolean;
}

export const JoinSession = ({ sessionId, onBack, isHost = false }: JoinSessionProps) => {
  const { profile } = useAuth();
  const [jitsiApi, setJitsiApi] = useState<any>(null);
  const [isSessionEnded, setIsSessionEnded] = useState(false);
  const jitsiContainer = useRef<HTMLDivElement>(null);

  const endSession = async () => {
    try {
      // Update session status to 'completed' in database
      await supabase
        .from('practice_matches')
        .update({ status: 'completed', end_time: new Date().toISOString() })
        .eq('id', sessionId);
      
      // Dispose Jitsi API to kick everyone out
      if (jitsiApi) {
        jitsiApi.dispose();
        setJitsiApi(null);
      }
      
      setIsSessionEnded(true);
      
      // Go back after a brief delay
      setTimeout(() => {
        onBack();
      }, 2000);
    } catch (error) {
      console.error('Error ending session:', error);
    }
  };

  // Initialize Jitsi Meet automatically when component loads
  useEffect(() => {
    // Prevent multiple initializations
    if (jitsiApi) {
      return;
    }

    const initializeJitsi = () => {
      if (typeof window !== 'undefined' && (window as any).JitsiMeetExternalAPI && jitsiContainer.current && profile) {
        const roomName = `vpaas-magic-cookie-33efea029781448088cb08c821f698b8/DebatePractice-${sessionId}`;
        
        // Use display name or username as fallback
        const displayName = profile.display_name || profile.username || 'Anonymous';
        const userNameWithRole = isHost ? `${displayName} (Host)` : displayName;
        
        const api = new (window as any).JitsiMeetExternalAPI("8x8.vc", {
          roomName,
          parentNode: jitsiContainer.current,
          width: '100%',
          height: '100%',
          userInfo: {
            displayName: userNameWithRole,
            email: profile.user_id + '@debate.app'
          },
          configOverwrite: {
            startWithAudioMuted: false,
            startWithVideoMuted: false,
            prejoinPageEnabled: false,
            enableWelcomePage: false,
            enableUserRolesBasedOnToken: false,
            // Give host moderation capabilities
            moderatedRoomServiceUrl: isHost ? undefined : null,
          },
          interfaceConfigOverwrite: {
            TOOLBAR_BUTTONS: isHost ? [
              'microphone', 'camera', 'closedcaptions', 'desktop', 'fullscreen',
              'fodeviceselection', 'hangup', 'profile', 'chat', 'recording',
              'livestreaming', 'etherpad', 'sharedvideo', 'settings', 'raisehand',
              'videoquality', 'filmstrip', 'invite', 'feedback', 'stats', 'shortcuts',
              'tileview', 'videobackgroundblur', 'download', 'help', 'mute-everyone',
              'mute-video-everyone'
            ] : [
              'microphone', 'camera', 'closedcaptions', 'desktop', 'fullscreen',
              'fodeviceselection', 'hangup', 'profile', 'chat', 
              'videoquality', 'filmstrip', 'settings', 'raisehand',
              'tileview', 'videobackgroundblur'
            ],
            SHOW_JITSI_WATERMARK: false,
            SHOW_WATERMARK_FOR_GUESTS: false,
            DEFAULT_BACKGROUND: '#000000'
          },
          jwt: "eyJraWQiOiJ2cGFhcy1tYWdpYy1jb29raWUtMzNlZmVhMDI5NzgxNDQ4MDg4Y2IwOGM4MjFmNjk4YjgvOWNkMGZmLVNBTVBMRV9BUFAiLCJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiJ9.eyJhdWQiOiJqaXRzaSIsImlzcyI6ImNoYXQiLCJpYXQiOjE3NTM4NTY5MzQsImV4cCI6MTc1Mzg2NDEzNCwibmJmIjoxNzUzODU2OTI5LCJzdWIiOiJ2cGFhcy1tYWdpYy1jb29raWUtMzNlZmVhMDI5NzgxNDQ4MDg4Y2IwOGM4MjFmNjk4YjgiLCJjb250ZXh0Ijp7ImZlYXR1cmVzIjp7ImxpdmVzdHJlYW1pbmciOmZhbHNlLCJmaWxlLXVwbG9hZCI6ZmFsc2UsIm91dGJvdW5kLWNhbGwiOmZhbHNlLCJzaXAtb3V0Ym91bmQtY2FsbCI6ZmFsc2UsInRyYW5zY3JpcHRpb24iOmZhbHNlLCJsaXN0LXZpc2l0b3JzIjpmYWxzZSwicmVjb3JkaW5nIjpmYWxzZSwiZmxpcCI6ZmFsc2V9LCJ1c2VyIjp7ImhpZGRlbi1mcm9tLXJlY29yZGVyIjpmYWxzZSwibW9kZXJhdG9yIjp0cnVlLCJuYW1lIjoiVGVzdCBVc2VyIiwiaWQiOiJnb29nbGUtb2F1dGgyfDEwNjgxMDQyNjc0MjIyMjA0NTc2MCIsImF2YXRhciI6IiIsImVtYWlsIjoidGVzdC51c2VyQGNvbXBhbnkuY29tIn19LCJyb29tIjoiKiJ9.zRLOjUstqdUBga_FBDYDirpX7VgLW_UOpIGV6uJ1hXqJVkItlOfIMGL3Qn9cjyyHWG-vveZu-V3v5pAnM9oBbR-g4FlSYQSzJeJwSF9Vr1cjRvNspwX_nheXPMjHprcpw0vAFTsnS-jkzHh_XcDTvNcIlbQBJ6RfsuXo98RMjeBG8hYyOvdM6cr6BNVmoI1YMwsonS-z_eQYVtJEs6mif_dTkhK-ScrR0ev2iZy-DDponmP3ntLL8edsu4qOSwlRFM63yb6fQmFvVyXxz_o9sJVfHcwA5DGa6o8rx4U-lr8YfDFhfoNHOQPFKvaCSxat1k_mt19TROuMNJKLnyLiIA"
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

        // Handle when room is ready
        api.addEventListener('videoConferenceJoined', () => {
          console.log('Successfully joined conference');
        });
      }
    };

    // Small delay to ensure the container is rendered and profile is loaded
    if (profile) {
      setTimeout(initializeJitsi, 100);
    }

    return () => {
      if (jitsiApi) {
        jitsiApi.dispose();
        setJitsiApi(null);
      }
    };
  }, []); // Remove all dependencies to prevent re-initialization

  if (isSessionEnded) {
    return (
      <div className="h-screen flex items-center justify-center bg-black">
        <div className="text-center text-white">
          <h2 className="text-2xl font-bold mb-4">Session Ended</h2>
          <p className="text-lg">The host has ended this session. Redirecting...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-black">
      {/* Header with controls */}
      <div className="absolute top-4 left-4 z-10 flex gap-2">
        <Button
          variant="secondary"
          onClick={onBack}
          className="flex items-center space-x-2 bg-white/90 hover:bg-white text-black"
        >
          <ArrowLeft size={20} />
          <span>Leave Session</span>
        </Button>
        
        {isHost && (
          <Button
            variant="destructive"
            onClick={endSession}
            className="flex items-center space-x-2 bg-red-600/90 hover:bg-red-600 text-white"
          >
            <Crown size={20} />
            <span>End Session</span>
          </Button>
        )}
      </div>

      {/* Full-screen video conference */}
      <div 
        ref={jitsiContainer}
        className="flex-1 w-full h-full"
      />
    </div>
  );
};