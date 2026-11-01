import './McpWidget.css'

export default function McpWidget({ widget }) {
  return (
    <div className="mcp-widget">
      <iframe
        title={widget.title}
        srcDoc={widget.html}
        sandbox=""
        referrerPolicy="no-referrer"
      />
    </div>
  )
}
