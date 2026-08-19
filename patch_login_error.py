import re

with open('src/pages/Login.tsx', 'r') as f:
    content = f.read()

bad_error_ui = """              {error && (
                <div className="p-3 bg-red-500/10 border border-red-500/50 rounded text-red-500 text-sm text-center">
                  {error}
                </div>
              )}"""

good_error_ui = """              {error && (
                <div className="p-3 bg-red-500/10 border border-red-500/50 rounded text-red-500 text-sm text-center flex flex-col gap-2">
                  <span>{error}</span>
                  {error.includes('Account not found') && (
                    <Link to="/signup" className="bg-amber-500 text-black px-4 py-2 rounded font-bold text-xs uppercase tracking-widest hover:bg-amber-400 transition-colors mx-auto w-fit">
                      Create Account
                    </Link>
                  )}
                </div>
              )}"""

content = content.replace(bad_error_ui, good_error_ui)

with open('src/pages/Login.tsx', 'w') as f:
    f.write(content)
