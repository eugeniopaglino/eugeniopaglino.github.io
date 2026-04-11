---
layout: page
permalink: /repositories/
title: repositories
description: These are some my repositories on GitHub, they include replication packages for published papers, teaching materials (see also teaching page), and current projects. Check my GitHub profile to see a complete list.
nav: true
nav_order: 3
---

## GitHub Repositories

{% if site.data.repositories.github_repos %}
<div class="repositories d-flex flex-wrap flex-md-row flex-column justify-content-between align-items-center">
  {% for repo in site.data.repositories.github_repos %}
    {% include repository/repo.html repository=repo %}
  {% endfor %}
</div>
{% endif %}
