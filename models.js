exports.models = {
    "Team": {
        "id": "Team",
        "required": ["name"],
        "properties": {
            "offense": {
                "type": "string",
                "description": "Player on offense position"
            },
            "defense": {
                "type": "string",
                "description": "Player on defense position"
            },
            "name": {
                "type": "string",
                "description": "Name of the team"
            }
        }
    },
    "Game": {
        "id": "Game",
        "required": ["gameId", "name"],
        "properties": {
            "gameId": {
                "type": "string",
                "description": "The Id of of the game"
            },
            "team_one": {
                "$ref": "Team",
                "description": "Team number one"
            },
            "team_two": {
                "$ref": "Team",
                "description": "Team number two"
            },
            "score": {
                "$ref": "Score",
                "description": "Score of the game"
            },
            "timeStarted": {
                "type": "date",
                "description": "Time when the game was started"
            },
            "timeEnded": {
                "type": "date",
                "description": "The time when the game finished"

            },
            "winner": {
                "type": "string",
                "description": "The name of the winning team if the game as been settled.",
                "enum": [
                    "team_one",
                    "team_two"
                ]
            }
        }
    },
    "Score": {
        "id": "Score",
        "required": ["team_one", "team_two"],
        "properties": {
            "team_one": {
                "type": "integer",
                "format": "int32",
                "description": "Score of team one"
            },
            "team_two": {
                "type": "integer",
                "format": "int32",
                "description": "Score of team two"
            }
        }
    }
};