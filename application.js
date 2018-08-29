/*
 * Created on : 2017-02-11, 23:03:12
 * Author     : jAANUSZEK0700
 *
 * sprites from:
 *  https://www.spriters-resource.com/nes/supermariobros/
 *  http://www.mariomayhem.com/downloads/sprites/super_mario_bros_sprites.php
 *
 * audio from:
 *  http://themushroomkingdom.net/media/smb/wav
 */

var all_clickable_items = [];
var statistics = {score: 0, coins: 0, lives: 3};
var settings = {scale: 4, player_name: 'MARIO', play_theme: false, volume: 10, scroll_type: "hover"};
var hud = {score: score_text(), coins: coins_text(), world: world_text(), time: time_text()};
var game = new Phaser.Game(screen.width, screen.height, Phaser.CANVAS, '', { preload: preload, create: create, update: update, render: render }, true);

/*
 * Wallpaper settings
 */
window.wallpaperPropertyListener = {
    applyUserProperties: function(properties) {
        if (properties.scale) {
            settings.scale = properties.scale.value + 2;
            rescale_all_elements();
        }

        if (properties.volume)
            settings.volume = properties.volume.value;

        if (properties.scroll_type)
            settings.scroll_type = properties.scroll_type.value;

        if (properties.theme_song) {
            settings.play_theme = properties.theme_song.value;
            if(game.audio) {
                game.audio.theme_song.stop();
                play_theme_song();
            }
        }

        if (properties.player_name) {
            switch(properties.player_name.value) {
                case 1:
                    settings.player_name = 'MARIO';
                    break;
                case 2:
                    settings.player_name = 'LUIGI';
                    break;
            }
            statistics.coins = 0;
            statistics.lives = 3;
            statistics.score = 0;
            game.camera.x = getX(11);
        }

        restart();
    }
};

/*
 * Loads all sprites to memory
 */
function preload() {
    game.load.bitmapFont('super_mario_font', 'assets/fonts/super_mario_font.png', 'assets/fonts/super_mario_font.fnt');
    game.load.image('floor', 'assets/images/floor_block.png');
    game.load.image('pipe_small_green', 'assets/images/pipe_small_green.png');
    game.load.image('pipe_medium_green', 'assets/images/pipe_medium_green.png');
    game.load.image('pipe_big_green', 'assets/images/pipe_big_green.png');
    game.load.image('grass_small', 'assets/images/grass_small.png');
    game.load.image('grass_medium', 'assets/images/grass_medium.png');
    game.load.image('grass_big', 'assets/images/grass_big.png');
    game.load.image('heel_small', 'assets/images/heel_small.png');
    game.load.image('heel_big', 'assets/images/heel_big.png');
    game.load.image('cloud_small', 'assets/images/cloud_small.png');
    game.load.image('cloud_medium', 'assets/images/cloud_medium.png');
    game.load.image('cloud_big', 'assets/images/cloud_big.png');
    game.load.image('hard_block', 'assets/images/hard_block.png');
    game.load.image('x_sign', 'assets/images/x.png');
    game.load.image('pole_flag', 'assets/images/finish_flag.png');
    game.load.image('pole', 'assets/images/finish_pole.png');
    game.load.image('castle0', 'assets/images/castle_small_0f.png');
    game.load.image('castle1', 'assets/images/castle_small_1f.png');
    game.load.image('castle_flag', 'assets/images/castle_flag.png');
    game.load.spritesheet('breakable_block', 'assets/images/breakable_block.png', 16, 16);
    game.load.spritesheet('hidden_block', 'assets/images/hidden_block.png', 16, 16);
    game.load.spritesheet('coin', 'assets/images/coin.png', 10, 14, 4, 0, 6);
    game.load.spritesheet('coin_spin', 'assets/images/coin_spin.png', 8, 14, 4, 1, 8);
    game.load.spritesheet('coin_mini', 'assets/images/coin_mini.png', 5, 8, 3, 0, 3);
    game.load.spritesheet('loot_block', 'assets/images/loot_block.png', 16, 16);
    game.load.spritesheet('piranha_plant', 'assets/images/piranha_plant.png', 16, 24);
    game.load.spritesheet('firework', 'assets/images/firework.png', 16, 16);
    game.load.audio('theme_song', 'assets/audio/theme.wav');
    game.load.audio('fast_theme_song', 'assets/audio/theme-x1.5.wav');
    game.load.audio('warning', 'assets/audio/warning.wav');
    game.load.audio('death', 'assets/audio/mariodie.wav');
    game.load.audio('coin', 'assets/audio/coin.wav');
    game.load.audio('bump', 'assets/audio/bump.wav');
    game.load.audio('1up', 'assets/audio/1-up.wav');
    game.load.audio('firework', 'assets/audio/firework.wav');

    game.stage.smoothed = false;
    game.stage.disableVisibilityChange = true;
    game.physics.arcade.gravity.y = 2000;
}

/*
 * Creates the whole map
 *
 * TODO: In future map creation should be done from .csv file
 */
function create() {
    append_blank_image({id: "move_left", x: 0, y: screen.height * 0.015, width: screen.width * 0.005, height: screen.height * 0.96, class: "stable"});
    append_blank_image({id: "move_right", x: screen.width - screen.width *0.005, y: screen.height * 0.015, width: screen.width *0.005, height: screen.height * 0.96, class: "stable"});

    game.elements = {
        background: game.add.group(),
        floor: game.add.group(),
        clouds: game.add.group(),
        pipes: game.add.group(),
        breakable_blocks: game.add.group(),
        loot_blocks: game.add.group(),
        enemies: game.add.group()
    };

    game.audio = {
        theme_song: game.add.audio('theme_song'),
        fast_theme_song: game.add.audio('fast_theme_song'),
        warning: game.add.audio('warning'),
        death: game.add.audio('death'),
        coin: game.add.audio('coin'),
        bump: game.add.audio('bump'),
        one_up: game.add.audio('1up'),
        firework: game.add.audio('firework')
    };

    hud.score = game.add.bitmapText(screen.width / 16 * 2, 16 * settings.scale, 'super_mario_font', score_text(), 8 * settings.scale);
    hud.coins = game.add.bitmapText(screen.width / 16 * 5 + 16 * settings.scale, 16 * settings.scale, 'super_mario_font', coins_text(), 8 * settings.scale);
    hud.world = game.add.bitmapText(screen.width / 16 * 8, 16 * settings.scale, 'super_mario_font', world_text(), 8 * settings.scale);
    hud.time = game.add.bitmapText(screen.width / 16 * 12, 16 * settings.scale, 'super_mario_font', time_text(), 8 * settings.scale);
    hud.x_sign = game.add.sprite(hud.coins.x - 8 * settings.scale, hud.coins.y + 10 * settings.scale, 'x_sign');

    hud.coin = game.add.sprite(hud.coins.x - 16 * settings.scale, hud.coins.y + 7 * settings.scale, 'coin_mini');
    hud.coin.animations.add('shine', [0, 1, 2, 1, 0], 6, true);
    hud.coin.animations.play('shine');

    game.elements.background.create(65, 1.1875, 'heel_small');
    game.elements.background.create(16, 1.1875, 'heel_small');
    game.elements.background.create(112, 1.1875, 'heel_small');
    game.elements.background.create(161, 1.1875, 'heel_small');
    game.elements.background.create(209, 1.1875, 'heel_small');
    game.elements.background.create(0, 2.1875, 'heel_big');
    game.elements.background.create(49, 2.1875, 'heel_big');
    game.elements.background.create(96, 2.1875, 'heel_big');
    game.elements.background.create(145, 2.1875, 'heel_big');
    game.elements.background.create(193, 2.1875, 'heel_big');
    game.elements.background.create(23.5, 1, 'grass_small');
    game.elements.background.create(72.5, 1, 'grass_small');
    game.elements.background.create(119.5, 1, 'grass_small');
    game.elements.background.create(158.5, 1, 'grass_small');
    game.elements.background.create(168.5, 1, 'grass_small');
    game.elements.background.create(206.5, 1, 'grass_small');
    game.elements.background.create(42.5, 1, 'grass_medium');
    game.elements.background.create(90.5, 1, 'grass_medium');
    game.elements.background.create(138.5, 1, 'grass_medium');
    game.elements.background.create(11.5, 1, 'grass_big');
    game.elements.background.create(60.5, 1, 'grass_big');
    game.elements.background.create(107.5, 1, 'grass_big');

    var pole = game.elements.background.create(199.25, 10.5, 'pole');
    var pole_flag = game.elements.background.create(198.55, 10, 'pole_flag');
    pole_flag.clicked = false;
    append_blank_image(pole, function() { pole_clicked(pole_flag, event) });

    var castle_flag = game.elements.background.create(205, 4.75, 'castle_flag');
    castle_flag.clicked = false;
    var castle = [game.elements.background.create(203, 3, 'castle0'),
        game.elements.background.create(204, 5, 'castle1')];
    $.each(castle, function (i, castle_block) {
        castle_block.id = "castle_floor-" + next_id();
        append_blank_image(castle_block, function() { castle_click(castle_flag) });
    });

    game.elements.floor.create(135, 1, 'hard_block');
    game.elements.floor.create(136, 1, 'hard_block');
    game.elements.floor.create(137, 1, 'hard_block');
    game.elements.floor.create(138, 1, 'hard_block');
    game.elements.floor.create(136, 2, 'hard_block');
    game.elements.floor.create(137, 2, 'hard_block');
    game.elements.floor.create(138, 2, 'hard_block');
    game.elements.floor.create(137, 3, 'hard_block');
    game.elements.floor.create(138, 3, 'hard_block');
    game.elements.floor.create(138, 4, 'hard_block');
    game.elements.floor.create(141, 4, 'hard_block');
    game.elements.floor.create(141, 3, 'hard_block');
    game.elements.floor.create(142, 3, 'hard_block');
    game.elements.floor.create(141, 2, 'hard_block');
    game.elements.floor.create(142, 2, 'hard_block');
    game.elements.floor.create(143, 2, 'hard_block');
    game.elements.floor.create(141, 1, 'hard_block');
    game.elements.floor.create(142, 1, 'hard_block');
    game.elements.floor.create(143, 1, 'hard_block');
    game.elements.floor.create(144, 1, 'hard_block');

    game.elements.floor.create(149, 1, 'hard_block');
    game.elements.floor.create(150, 1, 'hard_block');
    game.elements.floor.create(151, 1, 'hard_block');
    game.elements.floor.create(152, 1, 'hard_block');
    game.elements.floor.create(153, 1, 'hard_block');
    game.elements.floor.create(150, 2, 'hard_block');
    game.elements.floor.create(151, 2, 'hard_block');
    game.elements.floor.create(152, 2, 'hard_block');
    game.elements.floor.create(153, 2, 'hard_block');
    game.elements.floor.create(151, 3, 'hard_block');
    game.elements.floor.create(152, 3, 'hard_block');
    game.elements.floor.create(153, 3, 'hard_block');
    game.elements.floor.create(152, 4, 'hard_block');
    game.elements.floor.create(153, 4, 'hard_block');

    game.elements.floor.create(156, 4, 'hard_block');
    game.elements.floor.create(156, 3, 'hard_block');
    game.elements.floor.create(157, 3, 'hard_block');
    game.elements.floor.create(156, 2, 'hard_block');
    game.elements.floor.create(157, 2, 'hard_block');
    game.elements.floor.create(158, 2, 'hard_block');
    game.elements.floor.create(156, 1, 'hard_block');
    game.elements.floor.create(157, 1, 'hard_block');
    game.elements.floor.create(158, 1, 'hard_block');
    game.elements.floor.create(159, 1, 'hard_block');

    game.elements.floor.create(182, 1, 'hard_block');
    game.elements.floor.create(183, 1, 'hard_block');
    game.elements.floor.create(184, 1, 'hard_block');
    game.elements.floor.create(185, 1, 'hard_block');
    game.elements.floor.create(186, 1, 'hard_block');
    game.elements.floor.create(187, 1, 'hard_block');
    game.elements.floor.create(188, 1, 'hard_block');
    game.elements.floor.create(189, 1, 'hard_block');
    game.elements.floor.create(190, 1, 'hard_block');
    game.elements.floor.create(183, 2, 'hard_block');
    game.elements.floor.create(184, 2, 'hard_block');
    game.elements.floor.create(185, 2, 'hard_block');
    game.elements.floor.create(186, 2, 'hard_block');
    game.elements.floor.create(187, 2, 'hard_block');
    game.elements.floor.create(188, 2, 'hard_block');
    game.elements.floor.create(189, 2, 'hard_block');
    game.elements.floor.create(190, 2, 'hard_block');
    game.elements.floor.create(184, 3, 'hard_block');
    game.elements.floor.create(185, 3, 'hard_block');
    game.elements.floor.create(186, 3, 'hard_block');
    game.elements.floor.create(187, 3, 'hard_block');
    game.elements.floor.create(188, 3, 'hard_block');
    game.elements.floor.create(189, 3, 'hard_block');
    game.elements.floor.create(190, 3, 'hard_block');
    game.elements.floor.create(185, 4, 'hard_block');
    game.elements.floor.create(186, 4, 'hard_block');
    game.elements.floor.create(187, 4, 'hard_block');
    game.elements.floor.create(188, 4, 'hard_block');
    game.elements.floor.create(189, 4, 'hard_block');
    game.elements.floor.create(190, 4, 'hard_block');
    game.elements.floor.create(186, 5, 'hard_block');
    game.elements.floor.create(187, 5, 'hard_block');
    game.elements.floor.create(188, 5, 'hard_block');
    game.elements.floor.create(189, 5, 'hard_block');
    game.elements.floor.create(190, 5, 'hard_block');
    game.elements.floor.create(187, 6, 'hard_block');
    game.elements.floor.create(188, 6, 'hard_block');
    game.elements.floor.create(189, 6, 'hard_block');
    game.elements.floor.create(190, 6, 'hard_block');
    game.elements.floor.create(188, 7, 'hard_block');
    game.elements.floor.create(189, 7, 'hard_block');
    game.elements.floor.create(190, 7, 'hard_block');
    game.elements.floor.create(189, 8, 'hard_block');
    game.elements.floor.create(190, 8, 'hard_block');
    game.elements.floor.create(199, 1, 'hard_block');
    for ( var i = 0; i < 212.2; i++)
        if( $.inArray(i, [70, 71, 87, 88, 89, 154, 155]) == -1 )
            game.elements.floor.create(i, 0, 'floor');

    game.elements.clouds.create(18, 160, 'cloud_small');
    game.elements.clouds.create(28, 250, 'cloud_big');
    game.elements.clouds.create(39, 180, 'cloud_medium');
    game.elements.clouds.create(57, 250, 'cloud_small');
    game.elements.clouds.create(69, 190, 'cloud_small');
    game.elements.clouds.create(77, 250, 'cloud_big');
    game.elements.clouds.create(87, 180, 'cloud_medium');
    game.elements.clouds.create(105, 250, 'cloud_small');
    game.elements.clouds.create(116, 170, 'cloud_small');
    game.elements.clouds.create(124, 250, 'cloud_big');
    game.elements.clouds.create(133, 180, 'cloud_medium');
    game.elements.clouds.create(153, 250, 'cloud_small');
    game.elements.clouds.create(164, 190, 'cloud_small');
    game.elements.clouds.create(172, 250, 'cloud_big');
    game.elements.clouds.create(181, 180, 'cloud_medium');
    game.elements.clouds.create(201, 240, 'cloud_small');

    var plant_pipes = [];
    plant_pipes.push(game.elements.pipes.create(29, 2, 'pipe_small_green'));
    game.elements.pipes.create(39, 3, 'pipe_medium_green');
    plant_pipes.push(game.elements.pipes.create(47, 4, 'pipe_big_green'));
    game.elements.pipes.create(58, 4, 'pipe_big_green');
    game.elements.pipes.create(164, 2, 'pipe_small_green');
    plant_pipes.push(game.elements.pipes.create(180, 2, 'pipe_small_green'));
    plant_pipes.forEach(function(block){
        block.id = "piranha_plant-" + next_id();
        var plant = game.elements.enemies.create(block.x + 0.5, block.y, 'piranha_plant');
        plant.scale.setTo(settings.scale, settings.scale);
        plant.animations.add("bite", [0, 1], 6, true);
        plant.animations.play("bite");
        plant.clicked = false;
        append_blank_image(block, function() { piranha_plant_click(plant) });
    }, this);
    game.world.bringToTop(game.elements.pipes);

    game.elements.breakable_blocks.create(20, 4, 'breakable_block');
    game.elements.breakable_blocks.create(22, 4, 'breakable_block');
    game.elements.breakable_blocks.create(24, 4, 'breakable_block');
    game.elements.breakable_blocks.create(65, 5, 'hidden_block').loot = "coin";
    game.elements.breakable_blocks.create(79, 4, 'breakable_block');
    game.elements.breakable_blocks.create(81, 4, 'breakable_block');
    game.elements.breakable_blocks.create(82, 8, 'breakable_block');
    game.elements.breakable_blocks.create(83, 8, 'breakable_block');
    game.elements.breakable_blocks.create(84, 8, 'breakable_block');
    game.elements.breakable_blocks.create(85, 8, 'breakable_block');
    game.elements.breakable_blocks.create(86, 8, 'breakable_block');
    game.elements.breakable_blocks.create(87, 8, 'breakable_block');
    game.elements.breakable_blocks.create(88, 8, 'breakable_block');
    game.elements.breakable_blocks.create(89, 8, 'breakable_block');
    game.elements.breakable_blocks.create(93, 8, 'breakable_block');
    game.elements.breakable_blocks.create(94, 8, 'breakable_block');
    game.elements.breakable_blocks.create(95, 8, 'breakable_block');
    var coin_block = game.elements.breakable_blocks.create(96, 4, 'breakable_block');
    coin_block.loot = "coin";
    coin_block.coins = coin_block.max_coins = 10;
    game.elements.breakable_blocks.create(101, 4, 'breakable_block');
    game.elements.breakable_blocks.create(102, 4, 'breakable_block').loot = "coin";
    game.elements.breakable_blocks.create(119, 4, 'breakable_block');
    game.elements.breakable_blocks.create(122, 8, 'breakable_block');
    game.elements.breakable_blocks.create(123, 8, 'breakable_block');
    game.elements.breakable_blocks.create(124, 8, 'breakable_block');
    game.elements.breakable_blocks.create(129, 8, 'breakable_block');
    game.elements.breakable_blocks.create(130, 4, 'breakable_block');
    game.elements.breakable_blocks.create(131, 4, 'breakable_block');
    game.elements.breakable_blocks.create(132, 8, 'breakable_block');
    game.elements.breakable_blocks.create(169, 4, 'breakable_block');
    game.elements.breakable_blocks.create(170, 4, 'breakable_block');
    game.elements.breakable_blocks.create(172, 4, 'breakable_block');
    game.elements.breakable_blocks.forEach(function(block) {
        block.id = "breakable_block-" + next_id();
        block.animations.add('idle', [0], 1);
        block.animations.add('break', [1], 1);
        block.animations.play('idle');
        block.bounce = true;
        block.clicked = false;
        append_blank_image(block, function() { animate_box_click(block) });
    }, this);

    var first_block = game.elements.loot_blocks.create(16, 4, 'loot_block');
    game.elements.loot_blocks.create(21, 4, 'loot_block');
    game.elements.loot_blocks.create(22, 8, 'loot_block');
    game.elements.loot_blocks.create(23, 4, 'loot_block');
    game.elements.loot_blocks.create(80, 4, 'loot_block');
    game.elements.loot_blocks.create(96, 8, 'loot_block');
    game.elements.loot_blocks.create(107, 4, 'loot_block');
    game.elements.loot_blocks.create(110, 4, 'loot_block');
    game.elements.loot_blocks.create(110, 8, 'loot_block');
    game.elements.loot_blocks.create(113, 4, 'loot_block');
    game.elements.loot_blocks.create(130, 8, 'loot_block');
    game.elements.loot_blocks.create(131, 8, 'loot_block');
    game.elements.loot_blocks.create(171, 4, 'loot_block');
    game.elements.loot_blocks.forEach(function(block) {
        block.id = "loot_block-" + next_id();
        block.animations.add('shine', [0, 1, 2, 1, 0], 6, true);
        block.animations.add('break', [4], 1);
        block.animations.play('shine');
        block.loot = "coin";
        block.bounce = true;
        block.clicked = false;
        block.coins = 1;
        block.max_coins = 1;
        append_blank_image(block, function() { animate_box_click(block) });
    }, this);
    first_block.coins = first_block.max_coins = 10;

    if(game.elements) {
        game.elements.background.forEach(save_original_location, this);
        game.elements.breakable_blocks.forEach(save_original_location, this);
        game.elements.clouds.forEach(save_original_location, this);
        game.elements.floor.forEach(save_original_location, this);
        game.elements.loot_blocks.forEach(save_original_location, this);
        game.elements.pipes.forEach(save_original_location, this);
        game.elements.enemies.forEach(save_original_location, this);
    }

    game.camera.x = getX(11);

    set_running_out_of_time_event();
    move_all_blank_images();
    rescale_all_elements();
    bring_hud_to_front();
    play_theme_song();
    move_hud();
    restart();
}

function update() {
    update_hud();
}

function render() {

}

/*
 * Restarts whole game, score and settings
 */
function restart() {
    move_all_blank_images();

    if(game.audio){
        game.audio.theme_song.volume = settings.volume / 10;
    }

    $("#move_left").off();
    $("#move_right").off();
    add_camera_movement_function("left");
    add_camera_movement_function("right");

    move_hud();

    game.world.setBounds(0, 0, getX(212.2), screen.height);
}

/*
 * Scales all elements to match user preferences
 */
function rescale_all_elements() {
    if(game.elements) {
        game.elements.background.forEach(scale_element, this);
        game.elements.breakable_blocks.forEach(scale_element, this);
        game.elements.floor.forEach(scale_element, this);
        game.elements.loot_blocks.forEach(scale_element, this);
        game.elements.pipes.forEach(scale_element, this);
        game.elements.enemies.forEach(scale_element, this);

        var clouds_move_options = [1, 1, -1, -1, 2, 2, -2, -2];
        game.elements.clouds.forEach(function(cloud) {
            game.tweens.removeFrom(cloud);
            cloud.scale.setTo(settings.scale, settings.scale);
            cloud.x = getX(cloud.original_x);
            var move_length = clouds_move_options[Math.floor(Math.random() * clouds_move_options.length)];
            var variation = clouds_move_options[Math.floor(Math.random() * clouds_move_options.length)] * 2000;
            animateCloud(cloud, cloud.x, cloud.x + getX(move_length), Math.abs(move_length) * 1000 + 8000 + variation);
        }, this);
    }

    hud.score.fontSize = 8 * settings.scale;
    hud.coins.fontSize = 8 * settings.scale;
    hud.world.fontSize = 8 * settings.scale;
    hud.time.fontSize = 8 * settings.scale;

    if(hud.x_sign) {
        hud.x_sign.scale.setTo(settings.scale, settings.scale);
        hud.x_sign.x = hud.coins.x - 8 * settings.scale;
        hud.x_sign.y = hud.coins.y + 10 * settings.scale;
    }

    if(hud.coin) {
        hud.coin.scale.setTo(settings.scale, settings.scale);
        hud.coin.x = hud.coins.x - 16 * settings.scale;
        hud.coin.y = hud.coins.y + 7 * settings.scale;
    }

    $.each(all_clickable_items, function(i, object) {
        $("#" + object.id + ".movable").css({width: object.width + "px", height: object.height + "px", left: object.x, top: object.y})
    });
}

/*
 * Used to scale one element
 */
function scale_element(element) {
    element.scale.setTo(settings.scale, settings.scale);
    element.x = getX(element.original_x);
    element.y = getY(element.original_y);
}

/*
 * Saves to memory original location of element
 */
function save_original_location(element) {
    element.original_x = element.x;
    element.original_y = element.y;
}

/*
 * Start and stop of camera movement on screen edges, depends on user settings
 */
function add_camera_movement_function(direction) {
    var scroll_image = $("#move_" + direction);
    switch(settings.scroll_type) {
        case "hover":
            scroll_image.on('mouseenter', function (e) {
                hover_interval = window.setInterval(function () {
                    move_camera(direction)
                });
            }).on('mouseleave', function (e) {
                window.clearInterval(hover_interval);
                move_all_blank_images();
            });
            break;

        case "click":
            scroll_image.on('mousedown', function (e) {
                hover_interval = window.setInterval(function () {
                    move_camera(direction)
                });
            }).on('mouseup', function (e) {
                window.clearInterval(hover_interval);
                move_all_blank_images();
            }).on('mouseleave', function (e) {
                window.clearInterval(hover_interval);
                move_all_blank_images();
            });
            break;

        default:
            break;
    }
}

/*
 * Moves the camera in desired direction
 */
function move_camera(direction) {
    if(direction == "left")
        game.camera.x -= 4;
    else if(direction == "right")
        game.camera.x += 4;

    move_hud();
}

/*
 * Returns x coordinate of block no matter of scale
 */
function getX(blocks) {
    return blocks * 16 * settings.scale
}

/*
 * Returns y coordinate of block no matter of scale
 */
function getY(blocks) {
    return screen.height - (blocks * 16 + 12) * settings.scale
}

/*
 * Is responsible for clouds idle animation
 */
function animateCloud(cloud, minX, maxX, duration) {
    duration = duration || 10000 ;
    game.add.tween(cloud).to({
        x: [maxX, minX],
        y: [cloud.y, cloud.y]
    }, duration, Phaser.Easing.Quadratic.InOut, true, 0, -1).interpolation(Phaser.Math.bezierInterpolation);
}

/*
 * Keeps track of score
 */
function add_score(points, item) {
    if(statistics.score < 100000)
        statistics.score += points;
    else
        statistics.score = 999999;

    if(item) {
        var text = game.add.bitmapText(item.x + 6 * settings.scale, item.y - 8 * settings.scale, 'super_mario_font', points.toString(), 6 * settings.scale);
        game.add.tween(text).to({y: text.y - 1.7 * 16 * settings.scale}, 800, Phaser.Easing.Quadratic.Out, true).onComplete.add(text.kill, text);
    }
}

/*
 * Score template
 */
function score_text() {
    return settings.player_name + '\n' + statistics.score.pad(6);
}

/*
 * Adds coins up to 100, if more gains a life
 */
function add_coin() {
    statistics.coins++;
    if(statistics.coins >= 100) {
        statistics.coins = 0;
        add_life();
    }
}

/*
 * Plays jingle on life gain
 */
function add_life() {
    game.audio.one_up.play('', 0, settings.volume / 10);
    statistics.lives++;
}

/*
 * Plays jingle on life lose
 */
function remove_life() {
    game.audio.death.play('', 0, settings.volume / 10);
    statistics.lives--;
}

/*
 * Coins count template
 */
function coins_text() {
    return '\n' + statistics.coins.pad(2);
}

/*
 * World name template, displayed as current date
 */
function world_text() {
    var today = new Date();
    var dd = today.getDate();
    var mm = today.getMonth() + 1;
    return 'WORLD\n' + dd.pad(2) + '-' + mm.pad(2);
}

/*
 * Play time template displayed as current time
 */
function time_text() {
    var today = new Date();
    var hh = today.getHours();
    var mm = today.getMinutes();
    return 'TIME\n' + hh + ':' + mm.pad(2);
}

/*
 * Updates HUD
 */
function update_hud() {
    hud.score.text = score_text();
    hud.coins.text = coins_text();
    hud.world.text = world_text();
    hud.time.text = time_text();
}

/*
 * Moves HUD with camera movement
 */
function move_hud() {
    hud.score.x = game.camera.x + screen.width / 16 * 2;
    hud.coins.x = game.camera.x + screen.width / 16 * 5 + 16 * settings.scale;
    hud.world.x = game.camera.x + screen.width / 16 * 8;
    hud.time.x = game.camera.x + screen.width / 16 * 12;
    if(hud.coin) hud.coin.x = hud.coins.x - 16 * settings.scale;
    if(hud.x_sign) hud.x_sign.x = hud.coins.x - 8 * settings.scale;
}

/*
 * Keeps HUD in front of clouds, coins, ect.
 */
function bring_hud_to_front() {
    game.world.bringToTop(hud.score);
    game.world.bringToTop(hud.coins);
    game.world.bringToTop(hud.world);
    game.world.bringToTop(hud.time);
    game.world.bringToTop(hud.coin);
    game.world.bringToTop(hud.x_sign);
}

/*
 * Sets blank image on top of clickable sprite, this is important workaround of WallpaperEngine bug
 */
function append_blank_image(object, click_function, hover_function) {
    object.width = object.width || 16 * settings.scale;
    object.height = object.height || 16 * settings.scale;
    object.class = object.class || "movable";
    all_clickable_items.push(object);
    $("body").append("<img id='" + object.id + "' src='assets/images/blank.png' class='" + object.class +
        "' style='width: " + object.width + "px; height: " + object.height + "px; left: " + object.x + "px; top: " + object.y + "px'>");

    if(click_function)
        $("#" + object.id).click(click_function);

    if(hover_function) {
        $("#" + object.id).hover(hover_function);
    }
}

/*
 * Moves all blank images with screen movement
 */
function move_all_blank_images() {
    $.each(all_clickable_items, function (i, item) {
       $("img#" + item.id + ".movable").css("left", item.x - game.camera.x);
    });
}

/*
 * Plays mario theme in background
 */
function play_theme_song() {
    if(settings.play_theme)
        game.audio.theme_song.play('', 0, settings.volume / 10, true, false);
    else
        game.audio.theme_song.pause();
}

/*
 * Plays running out of time jingle just before midnight
 */
function set_running_out_of_time_event() {
    var now = new Date();
    var time_left = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 29, 59, 8, 0) - now;
    if (time_left < 0) {
        time_left = 0;
    }
    game.running_out_of_time_event = setTimeout(running_out_of_time, time_left);
}

/*
 * Running out of time melody
 */
function running_out_of_time() {
    var today = new Date();
    var hh = today.getHours();
    var mm = today.getMinutes();
    var ss = today.getSeconds();
    if(settings.play_theme) {
        game.audio.theme_song.pause();
        game.audio.warning.play('', 0, settings.volume / 10).onStop.add(function(){
            game.audio.fast_theme_song.play('', 0, settings.volume / 10).onStop.add(function(){
                game.audio.fast_theme_song.play('', 0, settings.volume / 10).onStop.add(function(){
                    game.audio.death.play('', 0, settings.volume / 10).onStop.add(function(){
                        game.audio.theme_song.play('', 0, settings.volume / 10, true, true);
                        set_running_out_of_time_event();
                    }, this);
                    statistics.lives--;
                }, this)
            }, this)
        }, this);
    }
}

/*
 * Starts the animation of piranha plant
 */
function piranha_plant_click(block) {
    if(!block.clicked) {
        block.clicked = true;
        game.add.tween(block).to({ y: block.y - 1.5 * 16 * settings.scale }, 1200, null, true);
        game.time.events.add(Phaser.Timer.SECOND * 2.4, function() {
            game.add.tween(block).to({ y: block.y + 1.5 * 16 * settings.scale }, 1200, null, true).onComplete.add(function() {
                game.time.events.add(Phaser.Timer.SECOND * 3, function() {block.clicked = false}, this);
            }, this);
        });
    }
}

/*
 * Starts the animation of castle based on current score, cant start to often
 */
function castle_click(flag) {
    if(!flag.clicked) {
        flag.clicked = true;
        var fireworks_locations = [[-1, 4],[-3.2, 1],[2, 2.5],[2.2, 0.2],[-0.5, 2.3],[-3, 0]];
        game.add.tween(flag).to({ y: flag.y - 1.12 * 16 * settings.scale }, 1400, null, true).onComplete.add(function() {
            for(var i = 0; i < Math.floor(statistics.score / 1000 % 7); i++)
                spawn_firework(flag.original_x + fireworks_locations[i][0], flag.original_y + 1.12 + fireworks_locations[i][1], i * 1050);
        }, this);
        game.time.events.add(Phaser.Timer.SECOND * 9, function() {
            game.add.tween(flag).to({ y: flag.y + 1.12 * 16 * settings.scale }, 1400, null, true).onComplete.add(function() {
                game.time.events.add(Phaser.Timer.SECOND * 26, function() {flag.clicked = false}, this);
            }, this);
        }, this);
    }
}

/*
 * Starts animation after clicking score pole
 */
function pole_clicked(flag, event) {
    if(!flag.clicked) {
        flag.clicked = true;

        var distance = event.y - getY(10);
        if(flag.y + distance < getY(9))
            distance = getY(9) - flag.y;
        distance = (9 * 16 * settings.scale) - distance;

        var points = Math.floor(distance / 12.75) * 100;
        if (points < 100)
            points = 100;
        if (points > 5000)
            points = 5000;

        add_score(points, flag);

        game.add.tween(flag).to({ y: flag.y + distance }, distance * 9, null, true).onComplete.add(function() {

            game.time.events.add(Phaser.Timer.SECOND * 4, function() {
                game.add.tween(flag).to({ y: flag.y - distance }, distance * 9, null, true).onComplete.add(function() {
                    game.time.events.add(Phaser.Timer.SECOND * 30, function() {flag.clicked = false}, this);
                }, this);
            }, this);
        }, this);

    }
}

/*
 * Shows firework animation
 */
function spawn_firework(x, y, delay) {
    delay = delay || 0;
    setTimeout(function() {
        var firework = game.add.sprite(getX(x), getY(y), 'firework');
        firework.scale.setTo(settings.scale, settings.scale);
        firework.animations.add('blast', null, 5);
        game.audio.firework.play('', 0, settings.volume / 10);
        add_score(500);
        firework.animations.play('blast').onComplete.add(function (item) {
            item.kill();
        });
    }, delay);
}

/*
 * Animates block after click
 */
function animate_box_click(block) {
    if(!block.clicked)
        if(block.bounce) {
            block.clicked = true;
            var tween = game.add.tween(block).to({
                y: [block.y - 0.4 * 16 * settings.scale, block.y]
            }, 200, Phaser.Easing.Quadratic.InOut, true).interpolation(Phaser.Math.linearInterpolation);
            tween.onComplete.add(function() {block.clicked = false}, block);
            if(block.loot)
                deploy_loot(block);
            else
                game.audio.bump.play('', 0, settings.volume / 10);
        } else
            game.audio.bump.play('', 0, settings.volume / 10);
}

/*
 * Deploys loot after click on lootable object
 */
function deploy_loot(block) {
    switch(block.loot) {
        case "coin":
            if(block.coins > 0 || block.coins == undefined) {
                var coin = game.add.sprite(block.x + 4 * settings.scale, block.y - 16 * settings.scale, 'coin_spin');
                coin.scale.setTo(settings.scale, settings.scale);
                coin.animations.add('coin_spin', null, 32, true);
                coin.animations.play('coin_spin');
                game.audio.coin.play('', 0, settings.volume / 10);
                block.coins = block.coins || 1;
                block.coins--;
                if (block.coins <= 0) {
                    block.animations.play('break');
                    block.bounce = false;
                    game.time.events.add(Phaser.Timer.SECOND * 8, function () {
                        block.bounce = true;
                        block.coins = block.max_coins || 1;
                        block.animations.play('idle');
                        game.elements.loot_blocks.forEach(function (b) {
                            b.animations.stop('shine', true)
                        }, this);
                        hud.coin.animations.stop('shine', true);
                        game.elements.loot_blocks.forEach(function (b) {
                            if (b.coins > 0)
                                b.animations.play('shine')
                        }, this);
                        hud.coin.animations.play('shine');
                    }, this);
                }
                var coin_tween = game.add.tween(coin).to({
                    y: [coin.y - 2.5 * 16 * settings.scale, coin.y - 8 * settings.scale]
                }, 380, null, true).interpolation(Phaser.Math.linearInterpolation);
                coin_tween.onComplete.add(function () {
                    add_score(200, block);
                    add_coin();
                    coin.kill();
                }, coin);
            } else
                game.audio.bump.play('', 0, settings.volume / 10);
            break;

        default:
            game.audio.bump.play('', 0, settings.volume / 10);
            break;

    }
}
