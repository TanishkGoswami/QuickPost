import re

file1 = "client/src/pages/auto-dm/MobilePreview.jsx"
with open(file1, 'r', encoding='utf-8') as f:
    content = f.read()

pattern = re.compile(
    r'<div className="mt-4 flex items-center gap-2">\s*<Avatar src=\{avatar\} username=\{username\} className="h-5 w-5" />\s*<div className="rounded-\[10px\] bg-\[#282828\] px-3 py-2 text-\[12px\] font-semibold text-white/55">\s*\{responseFlow\?\.follow_up_message \|\| \'Write a message\'\}\s*</div>\s*</div>',
    re.DOTALL
)

replacement = r"""{(!responseFlow?.nodes || responseFlow.nodes.length === 0) ? (
            <div className="mt-4 flex items-center gap-2">
              <Avatar src={avatar} username={username} className="h-5 w-5" />
              <div className="rounded-[10px] bg-[#282828] px-3 py-2 text-[12px] font-semibold text-white/55">
                Write a message
              </div>
            </div>
          ) : (
            responseFlow.nodes.map((node, index) => (
              <div key={node.id || index} className="mt-2 flex flex-col items-start gap-1 w-full">
                {node.type === 'text' && (
                  <div className="flex items-start gap-2 w-full">
                    <Avatar src={avatar} username={username} className="h-5 w-5 mt-1" />
                    <div className="rounded-[10px] bg-[#282828] px-3 py-2 text-[12px] font-semibold text-white max-w-[200px] whitespace-pre-wrap">
                      {node.content || 'Write a message'}
                    </div>
                  </div>
                )}
                {node.type === 'image' && (
                  <div className="flex items-start gap-2 w-full">
                    <Avatar src={avatar} username={username} className="h-5 w-5 mt-1" />
                    <div className="rounded-[10px] bg-[#282828] p-1">
                       <div className="w-[180px] h-[180px] bg-[#1f1f1f] rounded-lg flex items-center justify-center text-white/30 text-[10px]">Image</div>
                    </div>
                  </div>
                )}
                {node.buttons && node.buttons.length > 0 && (
                  <div className="ml-7 flex flex-col gap-1 w-full max-w-[200px]">
                    {node.buttons.map((btn, btnIdx) => (
                      <div key={btnIdx} className="rounded-md bg-[#3a3a3a] px-3 py-2 text-center text-[12px] font-bold text-white">
                        {btn.title || 'Button'}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))
          )}"""

content = pattern.sub(replacement, content)

with open(file1, 'w', encoding='utf-8') as f:
    f.write(content)
print("MobilePreview updated!")
