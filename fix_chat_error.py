import re

with open('src/pages/AIStudio.tsx', 'r') as f:
    content = f.read()

chat_err_old = """    } catch (err: any) {
      if (!auth.currentUser) {
        setMessages(prev => [...prev, { role: 'assistant', text: `Sorry, I encountered an error: ${err.message}` }]);
      }
    } finally {"""

chat_err_new = """    } catch (err: any) {
      let errMsg = err.message;
      if (errMsg.includes('429') || errMsg.includes('quota') || errMsg.includes('resource_exhausted')) {
          errMsg = "I'm currently receiving too many requests. Please try again in a few moments.";
      }
      setMessages(prev => [...prev, { role: 'assistant', text: `Sorry, I encountered an error: ${errMsg}` }]);
    } finally {"""

content = content.replace(chat_err_old, chat_err_new)

with open('src/pages/AIStudio.tsx', 'w') as f:
    f.write(content)
print("Updated chat error handler")
