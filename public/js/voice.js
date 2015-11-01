/*
Pluging jquery: Voice Driven Web Apps: Introduction to the Web Speech API
Autor: Jorge Rubiano.
Fuente: https://developers.google.com/web/updates/2013/01/Voice-Driven-Web-Apps-Introduction-to-the-Web-Speech-API
*/
(function($)
{
    $.fn.recognitionVoice = function()
    {
        var self = this;
        this.voice = {support: false, transcript : "", newRecognition : 0};
        if (('webkitSpeechRecognition' in window))
        {
            this.voice.support = true;
            var final_transcript = '';
            var recognizing = false;
            var ignore_onend = false;;
            recognition = new webkitSpeechRecognition();
            recognition.continuous = true;
            recognition.interimResults = true;
            recognition.onstart = function()
            {
                recognizing = true;
            };
            recognition.onerror = function(event)
            {
                if (event.error == 'no-speech')
                {
                    ignore_onend = true;
                }
                if (event.error == 'audio-capture')
                {
                    ignore_onend = true;
                }
                if (event.error == 'not-allowed')
                {
                    ignore_onend = true;
                }
            };
            
            recognition.onend = function()
            {
                recognizing = false;
                if (ignore_onend || !final_transcript)
                {
                    return;
                }
            };

            recognition.onresult = function(event)
            {
                final_transcript = "";
                for (var i = event.resultIndex; i < event.results.length; ++i)
                {
                    if (event.results[i].isFinal)
                    {
                        final_transcript += event.results[i][0].transcript;
                    }
                }
                if (final_transcript)
                {
                    self.voice.transcript = capitalize(final_transcript);
                    finish(self.voice.transcript);
                }
            };
        }
        this.voice.newRecognition = function(callback)
        {
            if (recognizing)
            {
                recognition.stop();
                finish = callback;
            }
            else
            {
                final_transcript = '';
                recognition.start();
                ignore_onend = false;
            }
        };

        function capitalize(s)
        {
            var first_char = /\S/;
            return s.replace(first_char, function(m) { return m.toUpperCase(); });
        }
        return this.voice;
    };
}( jQuery ));
