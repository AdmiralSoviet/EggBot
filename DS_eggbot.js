const Discord = require("discord.js");
const fs = require("fs");
const ytdl = require("ytdl-core");
const yousearch = require("youtube-search");
var os = require('os');
// retrieve config.json
var config = require('./egg_data/config');
// retrieve server_count.json
var server_count = require('./egg_data/server_count');
// retrieve commands.json
var commands = require('./egg_data/commands');
// retrieve songque.json
var songQue = require("./egg_data/songque");
// define bot as object
const client = new Discord.Client();
var skipped = [];

// youtube settings and API key
var opts = config.youtube_options;

// log to web
var app = require('express')();
var express = require('express');
var http = require('http').Server(app);
var io = require('socket.io')(http);
io.viewer_count = 0;


// log to file (basic version now for debug purposes, will be expanded upon later on)
function eggLog(content, server) {
    if (server) {
        server.name = server.name.replace(":", " ");
        fs.appendFile(__dirname + '/egg_data/logs/egglog_' + server.id + '_' + server.name + '.log', content + "\n", (err) => {
            if (err) throw err;
        });
    }
    fs.appendFile(__dirname + '/egg_data/logs/egglog.log', content + "\n", (err) => {
        if (err) throw err;
        console.log(content);
    });
    io.emit('egglog-entry', content);
}

app.get('/', function (req, res) {
    // -----------------------------------------------------------------------
    // authentication

    const auth = config.log_auth;

    const b64auth = (req.headers.authorization || '').split(' ')[1] || ''
    const [login, password] = new Buffer(b64auth, 'base64').toString().split(':')

    // Verify login and password are set and correct
    if (!login || !password || login !== auth.login || password !== auth.password) {
        res.set('WWW-Authenticate', 'Basic realm="nope"')
        res.status(401).send('You got the password incorrect :(')
        return
    }

    // -----------------------------------------------------------------------
    // Access granted...
    res.sendFile(__dirname + '/egglog.html');
});

io.on('connection', function (socket) {
    updateViewers(+1);
    socket.on('disconnect', function () {
        updateViewers(-1);
    });
});

function updateViewers(count) {
    io.viewer_count += count;
    console.log("[EGGLOG] There is now " + io.viewer_count + " user(s) watching the logs...");
    io.emit('viewer-count', io.viewer_count);
}
http.listen(config.port, function () {
    eggLog('[SUCCESS] EggLog listening on port ' + config.port);
});

// log message when logged in and ready
client.on('ready', () => {
    eggLog("--------------------\n" + client.user.username + " has logged in...\n--------------------");
});

// check if the user is the developer and return true or false
function devOnlyPermission(user) {
    if (user.id == config.devid) {
        return true
    } else {
        return false
    }
}
// check if user has 'ADMINISTRATOR' permissions for the channel the message was sent in.
function hasModPermission(message) {
    if (!message.guild || !message.member) {
        eggLog("[WARNING] User tried sending moderator command in DM!");
        return false;
    }
    if (message.channel.permissionsFor(message.member).hasPermission("ADMINISTRATOR") || devOnlyPermission(message.member)) {
        return true
    } else {
        return false
    }
}

// d&d style roll function
function rollf(arg) {
    arg = arg.split("d");
    var times = (arg[0] != "") ? parseInt(arg[0]) : 1;
    var die = parseInt(arg[1]);
    var result = {
        list: [],
        max: die * times,
        total: 0
    }
    for (var i = 1; i <= times; i++) {
        var roll = Math.floor(Math.random() * die) + 1;
        result.list.push(roll);
        result.total += roll;
    }
    return result;
}

// basic Grammer system with some validation
function Grammer(content) {
    if (content.includes("@")) {
        eggLog("Not letting '" + content + "' passed the content filter!");
    } else {
        var First = content[0].toUpperCase();
        content = content.slice(1);

        return First + content
    }
}
// retrieve random question
function randomQuestion(channel) {
    eggLog("List of questions: [" + config.questions + "]");
    if (typeof config.questions != "undefined" && config.questions != null && config.questions.length > 0) {
        eggLog("Asking a question...");
        response = config.questions[Math.floor(Math.random() * config.questions.length)];
    } else {
        response = "Can't think of any right now... Try asking me some!";
    }
    return response
}

// check if server id is already in config.json
function hasLoggedServer(message) {
    var haslogged = false;

    for (var property in server_count) {
        if (server_count.hasOwnProperty(property)) {
            if (server_count[property].id == message.guild.id) {
                haslogged = true
            }
        }
    }

    return haslogged
}
// generate random alpha-numeric string
function genString(length) {
    const chars = "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ";
    var result = '';
    for (var i = length; i > 0; --i) result += chars[Math.floor(Math.random() * chars.length)];
    return result;
}

// get a random wikihow image
function getWikihow() {
    var wikiHow = ["Choose-a-Puppy", "Do-Laughter-Yoga", "Avoid-Uncomfortable-Conversations-About-Religion", "Have-a-Happy-Healthy-and-Spiritually-Fulfilled-Old-Age", "Know-if-You-Are-Drunk", "Have-Fun-Without-Friends", "Cure-a-Headache-Without-Medication", "Be-an-Airhead", "Know-if-Your-Girlfriend-Wants-to-Have-Sex-With-You", "Make-Someone-Feel-Better-Via-Text-Message", "Turn-a-Girl-On", "Send-Dirty-Texts", "Fix-Bad-Breath-on-the-Spot", "Be-a-Spy", "Tell-when-a-Girl-Is-Interested-in-You", "Keep-a-Straight-Face", "Get-Over-an-Anime-Addiction", "Play-the-Alto-Saxophone", "Clear-a-Stuffy-Nose", "Write-a-Dystopian-Novel", "Get-Anime-Eyes", "Be-Emotionless", "Understand-Heterosexual-People", "Cheat-On-a-Test", "Live-in-Peace", "Lose-Your-Virginity-Without-Pain-(Girls)", "Get-Rid-of-an-Unwanted-Erection", "Resist-Sexual-Temptation", "Tell-a-Girl-You-Like-Her", "Make-Someone-You-Met-on-MSN-Love-You", "Enjoy-Phone-Sex", "Raise-a-Child", "Love-Your-Girlfriend", "Win-a-Tickle-War", "Talk-to-Girls-as-a-Teen-Boy", "Survive-a-Charging-Elephant", "Stop-Staring-at-a-Girl's-Boobs", "Make-Friends-Online", "Get-a-Gay-Male-Friend-(for-Girls)", "Reason", "Not-Do-Drugs", "Make-Your-Boyfriend-Break-up-With-You", "Give-Someone-a-Hickey", "Live-in-a-Dungeon", "Buy-Firearms-in-California", "Capture-Joie-De-Vivre", "Be-Naturally-Funny", "Be-Playful", "Be-a-Lesbian", "Convince-People-at-School-That-You're-a-Vampire", "Make-People-Think-You're-a-Witch", "Believe-in-God", "Read-People", "Get-on-a-Reality-TV-Show", "Overcome-an-Addiction", "Start-a-Cult", "Tell-a-Lie-Without-Being-Caught", "Increase-Your-Ejaculate", "Resist-Sexual-Desires-by-Following-Islamic-Traditions", "Prevent-Depression", "Make-Your-Boyfriend-Kiss-You", "Make-Yourself-Pee", "Fart-Quietly", "Treat-Nasal-Infection-Naturally", "Become-an-Alpha-Male", "Act-Like-One-of-the-Guys", "Be-a-Good-Husband", "Get-a-Lesbian-Girlfriend", "Stand-up-for-Yourself", "Act-Silly-with-Your-Boyfriend", "Understand-Gay-and-Lesbian-People", "Touch-a-Girl", "Turn-a-Girl-on-when-You're-Only-Friends", "Act-Like-Bella-from-Twilight", "Become-a-Teen-Hacker", "Dress-Up-Like-a-Hillbilly", "Impress-a-Classmate", "Show-Your-Husband-That-You-Love-Him", "Be-a-Good-Wife", "Love", "Be-Quirky", "Make-Your-Girlfriend-Want-to-Have-Sex-With-You", "Sue-for-Emotional-Distress", "Get-Over-an-Affair-and-Move-On-with-Your-Relationship", "Survive-in-a-Hotel", "Date-a-Stripper", "Get-a-Boy-to-Dance-With-You-and-then-Kiss-You-at-the-End-(Middle-School)", "Perform-a-Lap-Dance-for-Your-Boyfriend-or-Husband", "Grind-(for-Guys)", "Be-a-Trophy-Wife", "Start-Doing-Stand-up-Comedy", "Give-Your-Boyfriend-Space", "Understand-the-Male-Ego", "Be-Pretty", "Be-Subtle-About-Getting-a-Guy-to-Call-You", "Pole-Vault", "Be-a-Male-Housewife", "Be-Polite-in-Norway", "Be-Sassy", "Deal-With-a-Sarcastic-Person", "Become-Famous-on-the-Internet", "Make-Yourself-Famous-on-YouTube", "Get-Famous-While-Young", "Survive-a-Cold-Winter", "Discuss-Barack-Obama-Intelligently", "Know-if-Your-Boyfriend-Is-Being-Disrespectful-to-You", "Talk-to-Authority", "Be-a-Hipster-Girl", "Act-Drunk", "Tell-if-Someone-Is-High", "Win-a-Fist-Fight", "Talk-Dirty-in-Bed", "Persuade-a-Christian-to-Become-Atheist", "Make-a-Guy-That-Is-Mad-at-You-Like-You-Again-Through-Text", "Act-Like-a-Villain", "Act-Like-the-Doctor-of-Doctor-Who", "Act-Like-Royalty", "Be-Cunning", "Be-Edgy", "Be-Brave", "Motivate-Yourself", "Deal-With-a-Friend's-Death", "Survive-in-the-Woods", "Control-Rosacea", "Create-Urban-Rainforests", "Refuse-a-Kiss", "Be-Sexually-Empowered", "Respectfully-Decline-Sex", "Make-Out", "Avoid-Creating-a-Weak-Villain", "Learn-Smoking-Tricks", "Avoid-Getting-Caught-Smoking-by-Your-Parents", "Identify-Trauma-in-Autistic-People", "Stop-Binge-Drinking", "Flatulate-Secretively-(Teenagers)", "Be-Stealthy-Like-a-Ninja", "Calm-Down-Quickly", "Gargle", "Impress-People", "Not-Get-Arrested-While-Skateboarding", "Recognize-the-Signs-of-Intoxication", "Dissolve-the-Ego", "Be-Laid-Back", "Get-over-Eavesdropped-Phone-Sex-That-You-Had-Without-Knowing-It-Was-Eavesdropped", "Be-Strong", "Stay-Calm-Around-an-Ex", "Plan-a-Disney-Vacation", "Act-Like-Sonic-the-Hedgehog", "Become-a-Pastafarian", "Meet-a-Porn-Star-in-Your-Area", "Be-a-Punk", "Make-a-Friend-Fall-in-Love-with-You", "Be-a-World-Citizen", "Be-a-Fascist", "Flirt-With-a-Hot-Girl", "Write-a-Comedy-Sketch", "Release-Endorphins", "Feed-a-Snake", "Kick-Out-a-Dangerous-Roommate", "Identify-a-Psychopath", "Know-when-You'll-Get-Your-First-Period", "Stop-a-Masturbation-Addiction", "Fix-Your-Digestion", "Identify-Cervicitis", "Be-a-Christian-Leader", "Deal-With-Your-Parents'-Divorce", "Make-an-Upside-Down-Man-Costume", "Trick-People-into-Thinking-You're-Possessed", "Relax-when-You-Are-Sick", "Use-French-in-Conversations-About-Mammals", "Become-an-Olympian", "Smell-Seductive-on-Dates", "Prevent-Identity-Theft", "Pick-Up-Girls-in-High-School", "Be-a-Stripper-Who-Knows-What-She-is-Doing", "Be-a-True-Hip-Hop-Artist", "Exercise-Mindfulness-to-Be-Happier", "Say-Some-Common-Phrases-in-Esperanto", "Spot-a-Catfish", "Help-Save-Whales", "Win-at-Arm-Wrestling", "Pull-an-All-Nighter", "Deal-With-People-Who-Ignore-You", "Be-Confident-As-a-Overweight-Adult", "Be-Comfortable-in-Your-Own-Skin", "Visit-Laguna-Beach,-California", "Get-Over-Writer's-Block", "Put-Your-Arm-Around-a-Girl", "Channel", "Have-Jehovah's-Witnesses-Go-Away", "Laugh-Naturally-on-Cue", "Stop-a-Sneeze", "Respond-to-Fundamentalists", "Be-the-Type-of-Nerd-That-Girls-Love", "Induce-Nightmares", "Cosplay-As-Spongebob", "Take-Action-if-a-Guy-Calls-You-Ugly", "Simplify-Your-Life", "Know-Your-Warning-Signs-Before-Becoming-Abusive", "Be-Interesting", "Survive-Domestic-Violence", "Dance-Emo", "Develop-Common-Sense", "Survive-a-Freestyle-Rap-Battle", "Be-Unique", "Help-Paranoid-People", "Cure-Daffodil-Bulbs-for-Replanting", "Be-Persuasive", "Play-Wink-Murder", "Enhance-Your-Sarcasm-Skills", "Respond-to-Sarcasm", "Be-Hipster-Yet-Emo", "Start-an-Indie-Lifestyle", "Care-for-Uromastyx-Lizards", "Get-a-Free-Car-if-You-Have-a-Disability", "Build-a-Child's-Self-Esteem", "Play-a-Prank", "Not-Get-Nervous", "Run-Away-From-Home", "Be-a-Successful-Teenager", "Tell-if-a-Church-is-a-Cult", "Know-If-You-Have-DID-Or-Dissociative-Personality-Disorder", "Play-With-a-Pet", "Buy-Used-Electronics", "Stop-Thinking-that-Accepting-Help-is-a-Sign-of-Weakness", "Be-an-Educated-Man", "Be-a-Good-Entertainer", "Support-the-Arts", "Act-when-Your-Boyfriend-Keeps-Paying-for-Everything", "Deal-with-Strict-Christian-Parents", "Choose-a-Rigorous-College-Schedule-for-Your-First-Year", "Speak-Finnish", "Start-a-Best-Friends-Club", "Work-and-Study-at-the-Same-Time", "Get-Over-a-Crush-on-Your-Best-Friend", "Grow-Your-Hair-Super-Long", "Catch-a-Cheating-Girlfriend", "Succeed-in-a-Relationship-with-the-Perfect-Girl", "Be-Less-Clingy", "Catch-a-Cheating-Boyfriend", "Survive-a-Coyote-Attack", "Tell-if-You-Genuinely-Like-Someone", "Get-Along-with-Your-Crush", "Become-Good-at-Knife-Fighting", "Win-a-Race", "Come-Down-from-a-High", "Control-Your-Urge-to-Masturbate", "Enjoy-Pornography-in-the-Comfort-of-Your-Home", "Cosplay-Barbie", "Dance-at-a-Nightclub", "Ask-a-Girl-to-a-Dance", "Play-Bridge", "Decide-if-You-Should-Become-a-Stripper", "Heal-Broken-Bones", "Show-Respect", "Keep-Dogs-off-Lawn", "Create-a-Benefit-Concert-Series", "Have-a-Successful-Open-Source-Project", "Become-a-Hacker", "Deal-with-a-Love-Triangle", "Love-Yourself", "Disappear-Like-a-Ninja", "Get-Your-Nipples-Pierced", "Accept-Your-Boyfriend's-Interest-in-Pornography", "Find-a-Husband-when-the-Women-out-Number-the-Men-in-Your-Country", "Make-Friends", "Afford-Expensive-Stuff-(Teens)", "Make-Lemonade-when-Life-Gives-You-Lemons", "Humanely-Kill-a-Fish", "Put-on-Pantyhose"];
    var wikiPath = "http://damn.dog/img/pics/";
    var ActPath = "http://www.wikihow.com/";

    var randomNum = Math.floor(Math.random() * wikiHow.length);
    var wikihowTitle = wikiHow[randomNum];
    for (var i = 0; i < wikihowTitle.length; i++) {
        wikihowTitle = wikihowTitle.replace("-", " ");
    }
    var wikiEmbed = new Discord.RichEmbed();
    wikiEmbed.setTitle("How To " + wikihowTitle);
    wikiEmbed.setAuthor("wikiHow");
    wikiEmbed.setDescription("According to wikiHow, this is how you can " + wikihowTitle.toLowerCase() + "!");
    wikiEmbed.setURL(ActPath + wikiHow[randomNum]);
    wikiEmbed.setColor("PURPLE");
    wikiEmbed.setImage((wikiPath + wikiHow[randomNum] + ".jpg").toLowerCase());
    // wikiEmbed.setThumbnail("https://www.sortingoutseparation.org.uk/wp-content/uploads/2016/08/wiki-how-logo.png");
    wikiEmbed.setFooter("Images sourced from https://damn.dog");

    return wikiEmbed;
}
// Song object
function EgSong(link, title) {
    this.link = link;
    this.title = title;
    this.skipCount = 0;
    this.alreadyVoted = [];
    // function to check if the user has already voted
    this.checkVoted = function (userID) {
        eggLog("ALREADY VOTED: " + this.alreadyVoted);
        for (var i = 0; i < this.alreadyVoted.length; i++) {
            if (this.alreadyVoted[i] == userID) {
                return true
            }
        }
        return false;
    }
}

function addToQue(song, message) {
    var server = message.guild;
    // define the server's music que
    var workingQue = "eg_" + server.id;
    // make sure the que exists in songue.json
    if (songQue[workingQue]) {
        // make sure que doesn't have too many items for the !eg_que command
        if (songQue[workingQue].length <= 5) {
            songQue[workingQue].push(song); // add the song to the que
            json = JSON.stringify(songQue); //convert it back to json
            fs.writeFile(__dirname + '/egg_data/songque.json', json, 'utf8', (err) => {
                if (err) throw err;
                eggLog("Link has been logged!", message.guild)
                message.channel.send("'" + song.title + "' has been added to the queue!");
            });
        } else {
            return message.reply("The queue is full! Wait for the queue to clear or use !eg_clear");
        }
    } else {
        // if songque doesn't exist, create it
        eggLog("Creating queue array!", message.guild)
        songQue[workingQue] = [song];
        json = JSON.stringify(songQue); //convert it back to json
        fs.writeFile(__dirname + '/egg_data/songque.json', json, 'utf8', (err) => {
            if (err) throw err;
        });
    }
}

// check if current que is empty or not
function queIsEmpty(message) {
    var server = message.guild;
    var workingQue = "eg_" + server.id;
    if (songQue[workingQue]) {
        if (songQue[workingQue].length == 0) {
            return true // songque is empty
        } else {
            return false // it isn't empty
        }
    } else {
        // if songque doesn't exist, create it
        eggLog("Creating queue array!", message.guild)
        songQue[workingQue] = [];
        json = JSON.stringify(songQue); //convert it back to json
        fs.writeFile(__dirname + '/egg_data/songque.json', json, 'utf8', (err) => {
            if (err) throw err;
        });
        return true
    }
}

function clearQue(message) {
    var server = message.guild;
    var workingQue = "eg_" + server.id;
    songQue[workingQue] = [];
    json = JSON.stringify(songQue); //convert it back to json
    fs.writeFile(__dirname + '/egg_data/songque.json', json, 'utf8', (err) => {
        if (err) throw err;
        message.channel.send("Queue cleared!");
    });
}

function egPlay(voiceChannel, egSong, message) {
    var workingQue = "eg_" + message.guild.id;
    var broadcast = client.createVoiceBroadcast();
    voiceChannel.join()
        .then(connection => {
            // use the link of the first result
            let stream = ytdl(egSong.link, {
                // only stream audio channels
                filter: 'audioonly',
            });
            broadcast.playStream(stream);
            const dispatcher = connection.playBroadcast(broadcast);
            broadcast.on('end', () => {
                setTimeout(function () {
                    // make sure the song that 'ended' hasn't been skipped
                    eggLog(skipped);
                    for (var i = 0; i < skipped.length; i++) {
                        if (skipped[i] == egSong.link + message.guild.id) {
                            eggLog("Tried to play next song but the current one is still playing!");
                            skipped.splice(i, 1);
                            return
                        }
                    }
                    // play next video
                    stoppedPlaying(voiceChannel, message);
                }, 5000)
            });
        });
    eggLog("Joining channel", message.guild);
    message.channel.send('Now playing ' + egSong.title);
}

// play next song
function stoppedPlaying(voiceChannel, message) {
    var workingQue = "eg_" + message.guild.id;
    songQue[workingQue].splice(0, 1);
    json = JSON.stringify(songQue); //convert it back to json
    // write it back
    fs.writeFile(__dirname + '/egg_data/songque.json', json, 'utf8', (err) => {
        if (err) throw err;
        if (queIsEmpty(message) == false) {
            eggLog("Playing next song in queue...", message.guild)
            egPlay(voiceChannel, songQue[workingQue][0], message);
        } else {
            eggLog("Finished playing all songs in the queue!", message.guild);
            message.channel.send("Finished playing all songs in the queue.")
            voiceChannel.leave();
        }
    });
}
// add to list to make sure the bot doesn't try to skip a song that is currently playing
function addToBlacklist(link, message) {
    var skip = link + message.guild.id;
    skipped.push(skip);
}
// Skip Function
function skipSong(message) {
    var workingQue = "eg_" + message.guild.id;
    if (songQue[workingQue][0]) {
        addToBlacklist(songQue[workingQue][0].link, message);

        const voiceChannel = message.member.voiceChannel;
        // if user not in voice channel
        if (!voiceChannel) {
            return message.reply('Please be in a voice channel first!');
        }
        stoppedPlaying(voiceChannel, message);
    } else {
        return message.reply("Nothing to skip!");
    }
}

function populateServerList(guilds, callback) {
    guilds = guilds.array();
    for (var i = 0; i < guilds.length; i++) {
        server_count[guilds[i].id] = {};
        server_count[guilds[i].id].id = guilds[i].id;
        server_count[guilds[i].id].name = guilds[i].name;
        server_count[guilds[i].id].ownerID = guilds[i].ownerID;
        server_count[guilds[i].id].region = guilds[i].region;
        server_count[guilds[i].id].memberCount = guilds[i].memberCount;
        server_count[guilds[i].id].iconURL = guilds[i].iconURL;
    }
    json = JSON.stringify(server_count, null, 4); //convert it back to json
    fs.writeFile(__dirname + '/egg_data/server_count.json', json, 'utf8'); // write it back
    callback();
}

// called whenever a user deletes a message
client.on('messageDelete', message => {
    eggLog("Message '" + message.content + "' by " + message.author.username + " deleted.", message.guild);
});

// on message sent to channel, run this code
client.on('message', message => {
    var lowercase = message.content.toLowerCase();
    var secarg = lowercase.split(" ");
    var realarg = message.content.split(" "); // for when case is important
    var contentsaid = realarg.slice(1);
    contentsaid = contentsaid.join(" ");

    // log each message sent
    eggLog('[' + message.channel.name + '/' + message.channel.id + '] ' + message.author.username + ': ' + message.content, message.guild);

    if (message.attachments) {
        var mFiles = message.attachments.array();
        for (var i = 0; i < mFiles.length; i++) {
            eggLog(`[ATTACHMENT/${message.author.username}] ${mFiles[i].url}`, message.guild);
        };
    }
    if (message.embeds) {
        for (var i = 0; i < message.embeds.length; i++) {
            eggLog(`[EMBED] ${message.embeds[i].title}`, message.guild);
        }
    }
    // if a new server is detected, refresh server list
    if (client.guilds.array().length != Object.keys(server_count).length) {
        populateServerList(client.guilds, function () {
            eggLog("Server list refreshed!");
        });
    }

    // check if message author isn't the bot for this section of code (to stop infinite loops)
    if (message.author.id !== client.user.id) {
        // check if users have certain permissions
        if (message.content === '!eg_owner') {
            if (!devOnlyPermission(message.author)) {} else {
                message.reply("You're my developer.");
            }
        }
        if (message.content === '!eg_permission') {
            if (!hasModPermission(message)) {
                message.reply("You do not have access to my moderation functions.");
            } else {
                message.reply("You have permission to use my moderation functions.");
            }
        }
        // Command to print a list of commands stored in commands.json
        if (secarg[0] == "!eg_help") {
            var helplist = {};
            for (var property in commands) {
                if (commands.hasOwnProperty(property)) {
                    if (!helplist[commands[property].section]) {
                        helplist[commands[property].section] = new Discord.RichEmbed();
                        helplist[commands[property].section].setTitle("List of " + Grammer(commands[property].section) + " Commands");
                        helplist[commands[property].section].setColor("RANDOM");
                        helplist[commands[property].section].setThumbnail(client.user.avatarURL);
                        helplist[commands[property].section].setFooter("Requested " + helplist[commands[property].section].setTimestamp().timestamp);
                    }
                    helplist[commands[property].section].addField(commands[property].name, commands[property].description);
                }
            }
            for (var property in helplist) {
                if (helplist.hasOwnProperty(property)) {
                    message.channel.send(helplist[property]);
                }
            }
            eggLog(`Sending help list for '${message.author.username}'`, message.guild);
        }
        // generate invite code
        if (secarg[0] == "!eg_invite") {
            message.reply("Here's an invite link for me: https://discordapp.com/oauth2/authorize?&client_id=" + client.user.id + "&scope=bot&permissions=8")
        }
        // echo what the user says
        if (secarg[0] == "!eg_say" && hasModPermission(message) && secarg[1]) {
            message.delete();
            message.channel.send(contentsaid);
        }

        // ask how many servers egg-bot is running on
        if (message.content === '!eg_stats') {
            var embed = new Discord.RichEmbed({});
            embed.setColor("PURPLE");
            embed.setTitle(client.user.username + " Stats");
            embed.setThumbnail(client.user.avatarURL);
            embed.addField("Uptime: ", ((client.uptime / 1000) / 60).toFixed(2) + " minute(s)");
            embed.addField("Free System Memory (mb): ", (os.freemem() / 1000000).toFixed(2) + "/" + (os.totalmem() / 1000000).toFixed(2) + " (" + ((os.freemem() / os.totalmem()) * 100).toFixed(2) + "%)");
            embed.addField("Servers Running: ", client.guilds.array().length);
            embed.setFooter("Requested: " + embed.setTimestamp().timestamp);
            eggLog("User '" + message.author.username + "' has requested stats.", message.guild);
            message.channel.send(embed);
        }
        // roll command
        if (secarg[0] == '!eg_roll' && secarg[1]) {
            var loadMessage = message.channel.send("Rolling " + secarg[1] + "...");
            var roll = rollf(secarg[1]);
            var embed = new Discord.RichEmbed();
            embed.setTitle("Result of Rolling " + secarg[1] + "!");
            embed.setDescription(":game_die: The maximum for this roll is " + roll.max + ", here's how you rolled. :game_die:");
            embed.setColor("RANDOM");
            embed.setThumbnail("https://www.thediceplace.com/acatalog/opaque_d20_blue.jpg");
            var rollDur = roll.list.length;
            if (rollDur > 24) {
                rollDur = 23;
                eggLog("[WARNING] More than 24 rolls detected and embeds only support a max of 25 fields! Choosing to not show rolls 24 onwards. Total will still be calculated as per all " + roll.list.length + " rolls.", message.guild);
                embed.addField(":rotating_light: WARNING :rotating_light:", "More than 24 rolls detected and embeds only support a max of 25 fields! Choosing to not show rolls 24 onwards. Total will still be calculated as per all " + roll.list.length + " rolls.");
            }
            for (var i = 0; i < rollDur; i++) {
                embed.addField("Roll #" + (i + 1), roll.list[i], true);
            }
            embed.addField("Total Roll: ", roll.total);
            message.channel.send(embed);
        }
        if (message.content === '!eg_wikihow') {
            message.channel.send(getWikihow());
        }

        // chat system
        // detect if the bot is mentioned
        if (message.isMentioned(client.user.id)) {
            eggLog(message.author.username + " noticed me!");
            // check if the message is a question
            if (message.content.includes("?")) {
                // make sure the question doesn't include @ or isn't just ? before progressing
                if (!contentsaid.includes("@")) {
                    if (contentsaid != "?") {
                        eggLog("Learning '" + contentsaid + "' for later.");
                        config.questions.push(Grammer(contentsaid)); //add some data
                        json = JSON.stringify(config, null, 4); //convert it back to json
                        fs.writeFile(__dirname + '/egg_data/config.json', json, 'utf8'); // write it back
                    }
                };
                // response area
                var YesNo = ["yes", "no"]; // yes or no
                var YesOptions = ["Yes.", "All right.", "Aye.", "Beyond a doubt.", "By all means.", "Certainly.", "Definitely.", "Of course.", "Yep.", "Sure."]; // list of yes responses
                var NoOptions = ["No.", "Absolutely not.", "Never.", "Not at all.", "No way."]; // list of no responses
                var ChooseAnswer = YesNo[Math.floor(Math.random() * YesNo.length)]; // randomly pick yes or no
                if (ChooseAnswer == "no") {
                    // pick from no options and reply
                    var NoChosen = NoOptions[Math.floor(Math.random() * NoOptions.length)];
                    message.reply(NoChosen);
                } else {
                    // pick from yes options and reply
                    var YesChosen = YesOptions[Math.floor(Math.random() * YesOptions.length)];
                    message.reply(YesChosen);
                }
            }
            // check if the message is a greeting than reply. 
            else if (secarg[1] == 'hi' || secarg[1] == 'hello' || secarg[1] == 'hey' || secarg[1] == 'greetings') {
                message.reply('Hey!');
            } else if (contentsaid.toLowerCase().includes("thank")) {
                message.reply("No problem.");
            } else {
                var ranResponse = config.responses;
                var chooseResponse = ranResponse[Math.floor(Math.random() * ranResponse.length)];
                message.reply(chooseResponse);
            }
        }
        // ask a question sourced from user questions
        if (message.content == "!eg_askme") {
            message.channel.send("Hm. Let me think...");
            var question = randomQuestion(message.channel);
            message.channel.send(question);
            // capture next response to be stored as a possible answer for that question when asked
            // captureResponse(message, question);
        }

        /*
        --------------------------------------
                    MOD SECTION
        --------------------------------------
        */
        if (message.guild !== null) {
            if (message.content.includes('!eg_mute') && hasModPermission(message) && secarg[1]) {
                // get user object from mention
                var target = message.mentions.users.array()[0];
                // check if user has mentioned a valid target
                if (target) {
                    message.channel.send("Muting " + target.username + "!");
                    egMute(target, message.channel);
                } else {
                    message.channel.send("Argument invalid, try using an @mention instead!");
                }
            } else if (message.content.includes('!eg_unmute') && hasModPermission(message) && secarg[1]) {
                // get user object from mention
                var target = message.mentions.users.array()[0];
                // check if user has mentioned a valid target
                if (target) {
                    message.channel.send("Unmuting " + target.username + ".");
                    egUnMute(target, message.channel);
                } else {
                    message.channel.send("Argument invalid, try using an @mention instead!");
                }
            }
            if (secarg[0] == "!eg_kick" && hasModPermission(message) && secarg[1]) {
                // get user object from mention
                var target = message.mentions.members.array()[0];
                // check if user has mentioned a valid target
                if (target) {
                    eggLog("Kicking " + target.displayName + " because " + message.author.username + " told me to!", message.guild);
                    if (!secarg[2] || secarg[2] == "") {
                        secarg[2] = "No reason given."
                    }
                    eggLog("Target Kickable: " + target.kickable);
                    if (target.kickable) {
                        message.channel.send("Kicked " + target.displayName + " at the request of " + message.author.username + ".");
                        target.kick("Banned by " + message.author.username + ": " + secarg[2]);
                    } else {
                        message.channel.send("Cannot kick " + target.displayName + "!");
                    }
                } else {
                    message.channel.send("Argument invalid, try using an @mention instead!");
                }
            }
            if (secarg[0] == "!eg_ban" && hasModPermission(message) && secarg[1]) {
                // get user object from mention
                var target = message.mentions.members.array()[0];
                // check if user has mentioned a valid target
                if (target) {
                    eggLog("Banning " + target.displayName + " because " + message.author.username + " told me to!", message.guild);
                    if (!secarg[2] || secarg[2] == "") {
                        secarg[2] = "No reason given."
                    }
                    if (!secarg[3] || secarg[3] == "") {
                        secarg[3] = 0
                    }
                    eggLog("Target Banable: " + target.kickable);
                    if (target.bannable) {
                        message.channel.send("Banned " + target.displayName + " at the request of " + message.author.username + ".");
                        target.ban({
                            "reason": "Banned by " + message.author.username + ": " + secarg[2],
                            "days": secarg[3]
                        });
                    } else {
                        message.channel.send("Cannot ban " + target.displayName + "!");
                    }
                } else {
                    message.channel.send("Argument invalid, try using an @mention instead!");
                }
            }
            if (secarg[0] == "!eg_prune" && hasModPermission(message)) {
                // check if the user specified a number and it is less than or equal to 98
                var count = parseInt(secarg[1]);
                if (parseInt(secarg[1]) && count <= 100) {
                    if (count >= 98) {
                        count = 98;
                    }
                    var numberDelete = count + 2;
                    message.channel.send("Deleting messages...");
                    message.channel.fetchMessages({
                            limit: numberDelete
                        }) // fetch messages in a channel
                        .then(function (messages) {
                            eggLog("Recieved " + messages.size + " messages", message.guild);
                            // run on a delay of 3 seconds
                            setTimeout(function () {
                                message.channel.bulkDelete(messages, true); // delete those messages
                            }, 3000);
                        })
                } else {
                    message.channel.send("Argument invalid, use a number less than 100!");
                }
            };
            if (secarg[0] == "!eg_getlog" && hasModPermission(message) && message.guild) {
                message.author.send({
                        files: [{
                            attachment: `${__dirname}/egg_data/logs/egglog_${message.guild.id}_${message.guild.name}.log`,
                            name: `egglog_${genString(16)}.log`
                        }]
                    })
                    .then(msg => {
                        msg.delete(60000);
                    })
                message.delete();
            };
        }
        /*
        --------------------------------------
                    MUSIC SECTION
        --------------------------------------
        */
        if (secarg[0] == "!eg_addsong" && secarg[1]) {
            if (!message.guild || !message.member) {
                return message.channel.send("This command must be sent in a server!");
            }
            const voiceChannel = message.member.voiceChannel;
            // if user not in voice channel
            if (!voiceChannel) {
                return message.reply('Please be in a voice channel first!');
            }
            // options for video
            const streamOptions = {
                seek: 0,
                volume: 1
            };
            var workingQue = "eg_" + message.guild.id;
            // if link is detected run this
            if (realarg[1].includes("https://www.youtube.com/watch?v=")) {
                ytdl.getInfo(realarg[1], function (err, info) {
                    addToQue(new EgSong(realarg[1], info.title), message);
                    // addToQue(realarg[1], message, info.title);
                    if (realarg[1] == songQue[workingQue][0].link && songQue[workingQue].length == 1) {
                        egPlay(voiceChannel, songQue[workingQue][0], message);
                    }
                });
            } else {
                // search for the song on youtube
                yousearch(contentsaid, opts, function (err, results) {
                    if (err) return eggLog(err);
                    var link = results[0].link;
                    addToQue(new EgSong(link, results[0].title), message);
                    if (link == songQue[workingQue][0].link && songQue[workingQue].length == 1) {
                        egPlay(voiceChannel, songQue[workingQue][0], message);
                    }
                });
            }
        }
        if (secarg[0] == "!eg_queue") {
            // make sure this isn't a DM
            if (!message.guild || !message.member) {
                return message.channel.send("This command must be sent in a server!");
            }
            if (!queIsEmpty(message)) {
                var workingQue = "eg_" + message.guild.id;
                var text = "```\n---------------------------------------------------\n";
                for (var i = 0; i < songQue[workingQue].length; i++) {
                    text += i + 1 + "\nURL: " + songQue[workingQue][i].link;
                    text += "\nTITLE: " + songQue[workingQue][i].title + "\n---------------------------------------------------\n";
                }
                text += "```";
                message.channel.send("The current queue is:\n" + text);
            } else {
                message.channel.send("There are no items in the queue right now, try adding some!");
            }
        }
        // Force Skip
        else if (secarg[0] == "!eg_forceskip" && hasModPermission(message)) {
            if (!message.guild || !message.member) {
                return message.channel.send("This command must be sent in a server!");
            }
            skipSong(message);
        } else if (secarg[0] == "!eg_voteskip") {
            // make sure the command isn't sent inside of a DM
            if (!message.guild || !message.member) {
                return message.channel.send("This command must be sent in a server!");
            }
            var workingQue = "eg_" + message.guild.id;
            const voiceChannel = message.member.voiceChannel;
            // if user not in voice channel
            if (!voiceChannel) {
                return message.reply('Please be in a voice channel first!');
            }
            var countMembers = Array.from(voiceChannel.members.values()).length - 1; // subtract one to remove bot from vote
            // if the queue doesn't exist
            if (!songQue[workingQue]) {
                return message.reply("Nothing is playing!");
            }
            // if there is nothing in the que
            if (!songQue[workingQue][0]) {
                return message.reply("Nothing is playing!");
            }
            if (!songQue[workingQue][0].checkVoted(message.author.id)) {
                var requiredVote = Math.round(countMembers * 0.6); // 60% of vote required
                songQue[workingQue][0].skipCount += 1;
                eggLog("REQUIRED: " + requiredVote, message.guild);
                eggLog("VOTES: " + songQue[workingQue][0].skipCount, message.guild);
                // if the vote succeeds
                if (songQue[workingQue][0].skipCount >= requiredVote) {
                    message.channel.send("Enough people have voted to skip the song. (" + songQue[workingQue][0].skipCount + "/" + requiredVote + ")");
                    skipSong(message);
                } else {
                    // if the vote count isn't enough to skip yet.
                    songQue[workingQue][0].alreadyVoted.push(message.author.id);
                    message.reply("Your vote has been lodged! (" + songQue[workingQue][0].skipCount + "/" + requiredVote + ")")
                }
            } else {
                message.reply("You have already voted!");
            }
        }
        // mod only function to force the bot to play from the top of the queue (for debug reasons) 
        else if (secarg[0] == "!eg_forceplay" && hasModPermission(message)) {
            if (!message.guild || !message.member) {
                return message.channel.send("This command must be sent in a server!");
            }
            const voiceChannel = message.member.voiceChannel;
            // if user not in voice channel
            if (!voiceChannel) {
                return message.reply('Please be in a voice channel first!');
            }
            // options for video
            const streamOptions = {
                seek: 0,
                volume: 1
            };
            var workingQue = "eg_" + message.guild.id;
            if (songQue[workingQue]) {
                if (songQue[workingQue].length != 0) {
                    eggLog("Forcing song.", message.guild)
                    egPlay(voiceChannel, songQue[workingQue][0], message);
                }
            } else {
                return message.reply("There is no queue! Try adding a song instead.");
            }
        }
        // skip current song in queue

        // mod only function to force the bot to stop streaming
        else if (secarg[0] == "!eg_clear" && hasModPermission(message)) {
            if (!message.guild || !message.member) {
                return message.channel.send("This command must be sent in a server!");
            }
            const voiceChannel = message.member.voiceChannel;
            var workingQue = "eg_" + message.guild.id;
            if (!voiceChannel) {
                return message.reply('Please be in a voice channel first!');
            }
            message.channel.send("Stopping stream...");
            eggLog("Leaving channel.", message.guild)
            voiceChannel.leave();
            if (queIsEmpty(message) == false) {
                addToBlacklist(songQue[workingQue][0].link, message);
            }
            clearQue(message);
        }
        // search and pick at random from the list of results
        if (secarg[0] == "!eg_random" && contentsaid) {
            if (!message.guild || !message.member) {
                return message.channel.send("This command must be sent in a server!");
            }
            const voiceChannel = message.member.voiceChannel;
            var workingQue = "eg_" + message.guild.id;
            // if user not in voice channel
            if (!voiceChannel) {
                return message.reply('Please be in a voice channel first!');
            }
            // options for video
            const streamOptions = {
                seek: 0,
                volume: 1
            };
            // search for the song on youtube
            yousearch(contentsaid, opts, function (err, results) {
                if (err) return eggLog(err);
                // pick a random video from results
                var randomLink = results[Math.floor(Math.random() * results.length)];
                var link = randomLink.link;
                addToQue(new EgSong(link, randomLink.title), message);
                if (link == songQue[workingQue][0].link && songQue[workingQue].length == 1) {
                    egPlay(voiceChannel, songQue[workingQue][0], message);
                }
            });
        }


        /*
        -----------------------------------
                    DEV SECTION
        -----------------------------------
        */
        if (secarg[0] == "!eg_coclear" && devOnlyPermission(message.author) && secarg[1]) {
            if (secarg[1] == "questions") {
                config.questions = [];
                json = JSON.stringify(config); //convert it back to json
                fs.writeFile(__dirname + '/egg_data/config.json', json, 'utf8'); // write it back
                message.reply("Questions cleared!");
            } else if (secarg[1] == "servers") {
                server_count = {};
                json = JSON.stringify(server_count); //convert it back to json
                fs.writeFile(__dirname + '/egg_data/server_count.json', json, 'utf8'); // write it back
                message.reply("Servers cleared!");
            } else {
                message.reply("Invalid argument!");
            }
        }
        if (secarg[0] == "!eg_serverlist" && devOnlyPermission(message.author)) {
            populateServerList(client.guilds, function () {
                for (var property in server_count) {
                    if (server_count.hasOwnProperty(property)) {
                        var embed = new Discord.RichEmbed();
                        var s_server = server_count[property];
                        embed.setTitle(s_server.name);
                        embed.setThumbnail(s_server.iconURL);
                        embed.setColor("RANDOM");
                        embed.addField("Server ID:", s_server.id, true);
                        embed.addField("Owner ID:", s_server.ownerID, true);
                        embed.addField("Region:", s_server.region);
                        embed.addField("Members:", s_server.memberCount);
                        embed.setFooter("Requested: " + embed.setTimestamp().timestamp);
                        message.channel.send(embed)
                            .then(message => message.delete(client.guilds.array().length * 20000)); // wait 20 seconds per server (Should be enough to read each individual server tile)
                    }
                }
            });
            message.delete();
        }
        if (secarg[0] == "!eg_getlogall" && devOnlyPermission(message.author)) {
            var path = "egglog.log";
            if (secarg[1]) {
                var srvr = client.guilds.get(secarg[1]);
                if (srvr) {
                    srvr.name = srvr.name.replace(":", " ");
                    path = `egglog_${srvr.id}_${srvr.name}.log`;
                } else {
                    message.channel.send("Unable to find requested server!")
                        .then(msg => {
                            msg.delete(60000);
                        });
                    return false;
                }
            }
            message.author.send({
                    files: [{
                        attachment: `${__dirname}/egg_data/logs/${path}`,
                        name: `egglog_${genString(16)}.log`
                    }]
                })
                .then(msg => {
                    msg.delete(30000);
                })
        };
    }
});

function egMute(user, channel) {
    eggLog("Muting " + user.username);
    return channel.overwritePermissions(user, {
        SEND_MESSAGES: false,
    });
}

function egUnMute(user, channel) {
    eggLog("Unmuting " + user.username);
    return channel.overwritePermissions(user, {
        SEND_MESSAGES: true,
    });
}

// login into discord using token
client.login(config.ltoken)
    .then(function () {
        client.user.setActivity("!eg_help");
    });