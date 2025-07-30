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

    const initializeJitsi = async () => {
      if (typeof window !== 'undefined' && (window as any).JitsiMeetExternalAPI && jitsiContainer.current && profile) {
        const roomName = `vpaas-magic-cookie-33efea029781448088cb08c821f698b8/DebatePractice-${sessionId}`;
        
        // Use display name or username as fallback
        const displayName = profile.display_name || profile.username || 'Anonymous';
        const userNameWithRole = isHost ? `${displayName} (Host)` : displayName;
        
        try {
          // Generate fresh JWT token
          const { data: jwtData, error: jwtError } = await supabase.functions.invoke('generate-jitsi-jwt', {
            body: {
              roomName,
              userName: displayName,
              userEmail: profile.user_id + '@debate.app',
              isHost: isHost,
              userId: profile.user_id
            }
          });

          if (jwtError || !jwtData?.jwt) {
            console.error('Failed to generate JWT:', jwtError);
            return;
          }

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
              enableUserRolesBasedOnToken: true,
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
            jwt: jwtData.jwt
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
        } catch (error) {
          console.error('Error initializing Jitsi:', error);
        }
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
  }, [profile]); // Trigger when profile loads

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
    <div className="min-h-screen bg-black">
      {/* Header with back button only */}
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
        className="w-full h-screen"
      />

      {/* Bottom controls - End Session button for host - below the meeting area */}
      {isHost && (
        <div className="w-full py-8 px-4 bg-black">
          <div className="flex justify-start">
            <Button
              variant="destructive"
              onClick={endSession}
              className="flex items-center space-x-2 bg-red-600/90 hover:bg-red-600 text-white px-6 py-3"
            >
              <Crown size={20} />
              <span>End Session</span>
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};