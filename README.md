![Toggle wpautop](https://github.com/linchpin/toggle-wpautop/blob/master/.wordpress-org/banner-1544x500.png?raw=true)

![Build Status](https://github.com/linchpin/toggle-wpautop/workflows/Deploy%20to%20WordPress.org/badge.svg) ![Maintainability](https://codeclimate.com/github/linchpin/toggle-wpautop/maintainability)

# Toggle wpautop #

Easily disable the default wpautop filter on a post by post basis.



## Description ##

**Note: This plugin does not support the block editor but should continue to work without issue when using it with custom post types and the [Classic Editor Plugin](https://wordpress.org/plugins/classic-editor/).**

Before WordPress displays a post's content, the content gets passed through multiple filters to ensure that it safely appears how you enter it within the editor.

One of these filters is [wpautop](http://codex.wordpress.org/Function_Reference/wpautop "wpautop"), which replaces double line breaks with `<p>` tags, and single line breaks with `<br />` tags. However, this filter sometimes causes issues when you are inputting a lot of HTML markup in the post editor.

This plugin displays a checkbox in the publish meta box of the post edit screen that disables the [wpautop](http://codex.wordpress.org/Function_Reference/wpautop "wpautop") filter for that post.

Also adds a 'wpautop', or 'no-wpautop' class to the post_class filter to help with CSS styling.

## Installation ##

1. Upload the plugin folder to the `/wp-content/plugins/` directory
2. Activate the plugin through the 'Plugins' menu in WordPress
3. Proceed to the Settings->Writing and select which post types should have the option to disable the wpautop filter.


## Screenshots ##

1. The disable wpautop checkbox on post edit screens.
2. Settings->Writing page with plugin settings.

![Linchpin](https://github.com/linchpin/brand-assets/blob/master/github-opensource-banner.png?raw=true)
