import { NextRequest, NextResponse } from "next/server";

// Returns the WordPress plugin PHP file content as a zip-like download.
// In production you'd serve a real zip, but this sends the PHP file directly
// which users can rename to .php and upload to WordPress plugins folder.
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const agentId = searchParams.get("agentId") ?? "YOUR_AGENT_ID";
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://agent.persicore.ir";

  const phpContent = `<?php
/**
 * Plugin Name: Persicore Agent Chatbot
 * Plugin URI: https://persicore.ir
 * Description: Add Persicore AI chatbot to your WordPress site with a simple shortcode.
 * Version: 1.0.0
 * Author: Persicore
 * Author URI: https://persicore.ir
 * Text Domain: persicore-agent
 */

if (!defined('ABSPATH')) exit;

define('PERSICORE_AGENT_ID', '${agentId}');
define('PERSICORE_BASE_URL', '${baseUrl}');

function persicore_agent_enqueue() {
    wp_enqueue_script(
        'persicore-agent-widget',
        PERSICORE_BASE_URL . '/agent-widget.js',
        array(),
        '1.0.0',
        true
    );
    wp_add_inline_script(
        'persicore-agent-widget',
        'document.currentScript && document.currentScript.setAttribute("data-agent-id", "' . PERSICORE_AGENT_ID . '")',
        'before'
    );
}
add_action('wp_enqueue_scripts', 'persicore_agent_enqueue');

// Shortcode: [persicore_agent id="YOUR_AGENT_ID"]
function persicore_agent_shortcode($atts) {
    $atts = shortcode_atts(array('id' => PERSICORE_AGENT_ID), $atts);
    $id = esc_attr($atts['id']);
    $base = esc_url(PERSICORE_BASE_URL);
    return "<script src=\\"{$base}/agent-widget.js\\" data-agent-id=\\"{$id}\\" async></script>";
}
add_shortcode('persicore_agent', 'persicore_agent_shortcode');
?>`;

  return new NextResponse(phpContent, {
    headers: {
      "Content-Type": "application/octet-stream",
      "Content-Disposition": `attachment; filename="persicore-agent-${agentId}.php"`,
    },
  });
}
