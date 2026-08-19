import re

with open('src/pages/AIStudio.tsx', 'r') as f:
    content = f.read()

# Update ImageGenerator
image_gen_old = """  const [loading, setLoading] = useState(false);
  const [imageUrl, setImageUrl] = useState<string|null>(null);"""
image_gen_new = """  const [loading, setLoading] = useState(false);
  const [imageUrl, setImageUrl] = useState<string|null>(null);
  const [errorMsg, setErrorMsg] = useState<string|null>(null);"""
content = content.replace(image_gen_old, image_gen_new)

image_gen_handle = """      if (data.error) throw new Error(data.error);
      setImageUrl(data.imageUrl);
    } catch (err: any) {
      alert(`Error generating image: ${err.message}`);
    } finally {"""
image_gen_handle_new = """      if (data.error) throw new Error(data.error);
      setImageUrl(data.imageUrl);
      setErrorMsg(null);
    } catch (err: any) {
      if (err.message.includes('403') || err.message.includes('permission') || err.message.includes('429')) {
         setErrorMsg('Image generation is currently unavailable. This may be due to API quota limits or disabled Gemini Imagen API. Please try again later.');
      } else {
         setErrorMsg(`Error generating image: ${err.message}`);
      }
    } finally {"""
content = content.replace(image_gen_handle, image_gen_handle_new)

image_gen_ui_old = """          ) : imageUrl ? (
            <OptimizedImage src={imageUrl} alt="Generated Look" className="w-full h-full object-contain" />
          ) : (
            <div className="text-center text-zinc-600">
              <ImageIcon size={48} className="mx-auto mb-4 opacity-50" />
              <p>Your generated look will appear here.</p>
            </div>
          )}"""
image_gen_ui_new = """          ) : errorMsg ? (
            <div className="text-center text-red-500 p-8">
              <ImageIcon size={48} className="mx-auto mb-4 opacity-50 text-red-500" />
              <p className="font-medium">{errorMsg}</p>
            </div>
          ) : imageUrl ? (
            <OptimizedImage src={imageUrl} alt="Generated Look" className="w-full h-full object-contain" />
          ) : (
            <div className="text-center text-zinc-600">
              <ImageIcon size={48} className="mx-auto mb-4 opacity-50" />
              <p>Your generated look will appear here.</p>
            </div>
          )}"""
content = content.replace(image_gen_ui_old, image_gen_ui_new)

# Update VideoGenerator
video_gen_old = """  const [status, setStatus] = useState<string>('');
  const [videoUrl, setVideoUrl] = useState<string|null>(null);"""
video_gen_new = """  const [status, setStatus] = useState<string>('');
  const [videoUrl, setVideoUrl] = useState<string|null>(null);
  const [errorMsg, setErrorMsg] = useState<string|null>(null);"""
content = content.replace(video_gen_old, video_gen_new)

video_gen_handle = """      trackEvent('AI Video Generation Completed');
    } catch (err: any) {
      alert(`Error animating video: ${err.message}`);
    } finally {"""
video_gen_handle_new = """      trackEvent('AI Video Generation Completed');
      setErrorMsg(null);
    } catch (err: any) {
      console.error(err);
      if (err.message.includes('403') || err.message.includes('permission') || err.message.includes('veo') || err.message.includes('not found') || err.message.includes('disabled')) {
         setErrorMsg('Video generation (Veo API) is currently in closed preview or unavailable for this project. Please configure a supported Video generation API.');
      } else {
         setErrorMsg(`Error animating video: ${err.message}`);
      }
    } finally {"""
content = content.replace(video_gen_handle, video_gen_handle_new)

video_gen_ui_old = """          ) : videoUrl ? (
            <video src={videoUrl} controls autoPlay loop className="w-full h-full object-cover" />
          ) : (
            <div className="text-center text-zinc-600">
              <Video size={48} className="mx-auto mb-4 opacity-50" />
              <p>Your animation will appear here.</p>
            </div>
          )}"""
video_gen_ui_new = """          ) : errorMsg ? (
            <div className="text-center text-red-500 p-8">
              <Video size={48} className="mx-auto mb-4 opacity-50 text-red-500" />
              <p className="font-medium">{errorMsg}</p>
            </div>
          ) : videoUrl ? (
            <video src={videoUrl} controls autoPlay loop className="w-full h-full object-cover" />
          ) : (
            <div className="text-center text-zinc-600">
              <Video size={48} className="mx-auto mb-4 opacity-50" />
              <p>Your animation will appear here.</p>
            </div>
          )}"""
content = content.replace(video_gen_ui_old, video_gen_ui_new)

with open('src/pages/AIStudio.tsx', 'w') as f:
    f.write(content)
print("Updated generators error handling")
