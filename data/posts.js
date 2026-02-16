// Blog posts data
const BLOG_POSTS = {
  "posts": [
    {
      "id": "1771244669653",
      "slug": "installing-kde-on-ubuntu-and-making-it-faster-app-recommendations",
      "title": "Installing KDE on Ubuntu and making it faster, + app recommendations",
      "author": "",
      "date": "2026-02-16",
      "categories": ["OS","Recommendation"],
      "excerpt": "Firstly install KDE:sudo apt install kde-plasma-desktopThen remove Gnome stuff:sudo apt purge ubuntu-gnome-desktop gnome-shell gnome-session gdm3 gnom...",
      "content": "Firstly install KDE:<div><span style=\"font-size: 1.0625rem;\">\n        <pre>sudo apt install kde-plasma-desktop</pre></span></div>\n<div><span style=\"font-size: 1.0625rem;\">Then remove Gnome stuff:</span><br>\n    <pre>sudo apt purge ubuntu-gnome-desktop gnome-shell gnome-session gdm3 gnome* \nsudo apt autoremove --purge -y</pre></div>\n<div>Next is to install display manager for KDE:<br>\n    <div>\n        <pre>sudo apt install sddm \nsudo dpkg-reconfigure sddm</pre>\n    </div>\n</div>\n<div>Select sddm as default login manager</div>\n<div>Remove Snaps and snap version of Firefox:<br>\n    <pre>sudo snap remove firefox\nsudo apt purge snapd -y\nsudo rm -rf /var/cache/snapd/ /snap /var/snap /home/*/snap\nsudo apt-mark hold snapd\necho -e 'Package: snapd\\nPin: release *\\nPin-Priority: -10' | sudo tee /etc/apt/preferences.d/nosnap.pref\nsudo rm -rf /var/cache/snapd /snap /var/snap /home/$USER/snap<br></pre>\n</div>\n<div>If other snaps exist, remove them as well. List them using command<br><pre>sudo list</pre></div>\n<div>Now to install non snap version of Mozila Firefox:<br>\n    <pre>sudo add-apt-repository ppa:mozillateam/ppa\nsudo apt update<br></pre>\n</div>\n<div>Create a preferences file:</div>\n<pre>sudo nano /etc/apt/preferences.d/mozilla-firefox</pre>\nWith this inside:<br>\n<pre>Package: firefox*\nPin: release o=LP-PPA-mozillateam\nPin-Priority: 1001</pre>\n<div>Now you can install Firefox:<br>\n    <pre>sudo apt install firefox -y</pre></div>\n<div>To improve system speed and not care about 'security', remove microcode updates and&nbsp;</div>\n<div>firmware updates that&nbsp;<span style=\"font-size: 1.0625rem;\">will slowdown PC and maybe even break BIOS.</span>\n</div>\n<div>\n    <pre>sudo apt purge intel-microcode amd64-microcode\nsudo apt-mark hold intel-microcode amd64-microcode\n</pre></div>\n<div>\n    <pre>sudo systemctl disable --now fwupd.service\nsudo systemctl disable --now fwupd-refresh.service<br></pre>\n</div>\n<pre>sudo systemctl mask fwupd.service fwupd-refresh.service\nsudo apt remove --purge fwupd\nsudo apt autoremove --purge</pre>\n<div>To make laptop quieter and fans not spining as often:<br></div><pre>sudo apt install tlp\nsudo systemctl enable --now tlp</pre>Now i prefer to use allias for installing apps, cause many times I get\n    annoyed when&nbsp;\n<div>apt install asks me for sudo again&nbsp;<span style=\"font-size: 1.0625rem;\">and again and again.&nbsp;</span></div>\n<div><span style=\"font-size: 1.0625rem;\">Then i have to writte it again or arrow up and modify. SO\n        ANNOYING!&nbsp;</span></div>\n<div><span style=\"font-size: 1.0625rem;\">So i prefer this alias:</span></div>\n<div>Just type \"pI\" and you have command \"sudo apt install\", like \"pI firefox\" installs firefox.&nbsp;<br>\n    <pre>echo \"alias apt='sudo apt'\" | sudo tee -a /etc/bash.bashrc &gt; /dev/null\necho \"alias apt-get='sudo apt-get'\" | sudo tee -a /etc/bash.bashrc &gt; /dev/null\necho \"alias pI='sudo apt install'\" | sudo tee -a /etc/bash.bashrc &gt; /dev/null\necho \"alias pS='sudo apt search'\" | sudo tee -a /etc/bash.bashrc &gt; /dev/null\necho \"alias pR='sudo apt remove'\" | sudo tee -a /etc/bash.bashrc &gt; /dev/null\necho \"alias pU='sudo apt update'\" | sudo tee -a /etc/bash.bashrc &gt; /dev/null\n</pre></div>\n<div>Now for partial security i tend to block internet access to apps using OpenSnitch,</div>\n<div>you can find it on Github and casual Fail2Ban is installed on my PC.&nbsp;</div>\n<div>But if you are more serious just use some of</div>\n<div>intrusion detection systems, both network based and host based.</div>\n<div>Like Suricata and OSSEC, which I learned about in crushes university final project.</div>\n<div><br></div>\n<div>If you don't have text editor or software store when you installed KDE, you can install it</div>\n<div>separately:<br><pre>sudo apt install plasma-discover\nsudo apt install kate</pre></div><div>For office apps i recommend chinese WPS office, it's much much better then Libre and OpenOffice,</div>\n<div>I know it's closed source, but it's miles better then old looking LibreOffice so:<br>sudo apt purge libreoffice*\n</div>\n<div><pre>sudo apt install wps</pre>Then download .deb WPS office from their website to install it.</div>\n<div><br></div>\n<div>For Photo editing, if you want shitty software use GIMP, me personally I use Photopea,</div>\n<div>something like web version of Photoshop, which is not perfect for smooth crops,</div>\n<div>but does the work. Recently someone made Photoshop to work using Steam and Proton,</div>\n<div>there is patch somewhere online, you can find it. But I haven't tested it yet.</div>\n<div><br></div>\n<div>If you need to build apps or run some apps that require other distro, like Autodesk Maya,</div>\n<div>which i use. You can use distrobox app. For building apps i have Arch linux container within&nbsp;</div>\n<div>distrobox, which uses podman. Yes, you can use Docker, but distrobox has less isolation&nbsp;</div>\n<div>and has built in export function for apps, has access to audio also, but more network isolation,</div>\n<div>you can't use Wireshark inside it properly, but you can inside Docker.</div>\n<div>For example building latest apps i have Arch linux container, and i get latest packages inside it,</div>\n<div>and I can install whatever without affecting my main system. For some apps you might need to create</div><div>container image with systemd enabled using using --init flag when creating image.<br>To install distrobox:</div>\n<div><pre>sudo apt install distrobox</pre></div>\n<div>Also i recommend using flatpak instad of snaps and then you can search and install</div><div>flatpak apps by searching flatpak store. To install and configure on KDE.</div><div><pre>sudo apt install flatpak</pre><pre>sudo apt install kde-config-flatpak</pre><pre>flatpak remote-add --if-not-exists flathub https://flathub.org/repo/flathub.flatpakrepo\n</pre></div><div>Now you can use also Discover to install apps.</div><div>For other apps that I personally use, you can find them on my Github.<br>I use my own media player, file sorting app, system monitor the most.<br>KDE System Monitor is so poorly optimized that even my web app version is more efficient...</div><div>+ it has more fetures&nbsp;</div><div>To save your Linux from being broken, you can create snapshots using Timeshift app:</div><div><pre>sudo apt install timeshift</pre></div><div>I used it a lot when i had Arch linux. But haven't set it up on Ubuntu, I think</div><div>it requires BTRFS type of partition. But i read there's some RSYNC option that works.</div><div><br></div>\n<div><br></div>\n<div><br></div>\n<div><br></div>\n<div><br></div>\n<div><br></div>\n<div><span style=\"font-size: 1.0625rem;\"><br></span></div>\n<div><br>\n    <div><br></div>\n</div>",
      "encrypted": false,
      "encryptedContent": null
    },
    {
      "id": "1771251097228",
      "slug": "secret-post-password-is-not-123",
      "title": "Secret post (password is not 123)",
      "author": "",
      "date": "2026-02-16",
      "categories": [
        "Secret"
      ],
      "excerpt": "",
      "content": "",
      "encrypted": true,
      "encryptedContent": {
        "encrypted": "YWLxBbMDVDvLe2QRlNUIwnBfXyD1vAjCnjJ1nh3lT8D9wz66/RnnrY4Bam4j/TUXeMIvVcYPYXdmPNT7RojBEiE1QFBWVtJ/y2o3Xt7cCjCxJwVCRRoP/3QH9N1XSArG0UD8z/hZvjvQoN3CdPxZx71cFd34xT609OtN6APHaaha+2bmX/NfNXo7OR2lm0bsSkc4e3CnykMUzg4lwMq4qhj6L21YshXtpQto/JiuFECgHbwi7HfHHN4Ms69qIpUmqmEX5I5hwTTok+jr5dL7ehR7NSSzYezQeWvFhvfDmHKEOOltysJ7eIIC7SFhhBU0",
        "salt": "V7/WPo3K7hGYihxFgVDlgA==",
        "iv": "MQopGRQK0uCzjTb3"
      }
    },
    {
      "id": "1",
      "slug": "welcome-to-my-blog",
      "title": "Welcome to My Blog",
      "author": "Blog Author",
      "date": "2026-02-15",
      "categories": [
        "General",
        "Announcements"
      ],
      "excerpt": "This is my first blog post. I'm excited to share my thoughts and ideas with you!",
      "content": "<p>Welcome to my new blog! This is a place where I'll be sharing my thoughts, experiences, and insights on various topics.</p><p>I'm really excited to start this journey and I hope you'll join me along the way. Feel free to explore the posts and let me know what you think</p><h2>What to Expect</h2><pre>I'll be writing about technology, design, personal development, and much more. Each post will aim to provide value and spark interesting discussions.</pre><p>Thank you for visiting, and stay tuned for more content!</p>",
      "encrypted": false,
      "encryptedContent": null
    }
  ]
};
