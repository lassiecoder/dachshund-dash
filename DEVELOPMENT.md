# Development Documentation

## Built With

- **AI Assistant**: Claude Opus 4.5 (GitHub Copilot)
- **Platform**: VS Code with GitHub Copilot Chat

## Development Prompts Used

The game was iteratively built and refined using the following prompts:

1. **Cloud Animation**: "make the clouds moving from right to left"
   - Added dynamic cloud objects with position, scale, and speed properties
   - Implemented `updateClouds()` function for right-to-left movement with screen wrapping

2. **More Clouds**: "add more clouds"
   - Expanded from 3 to 7 clouds with varied positions, sizes, and speeds for a richer sky

3. **Dog Positioning**: "dog is not on grass"
   - Adjusted dog's y-position to sit properly on the ground

4. **Dog Positioning Fix**: "still same issue, it should be on the green line area"
   - Fixed sprite height calculation (12 rows × 3px = 36px actual height)
   - Updated all dog y-position references to use `groundY - 36`

## Game Features

- Pixel art dachshund with running animation
- Ball throwing mechanics with physics (gravity, bounce, friction)
- Fetch and return gameplay loop
- Animated clouds with parallax effect
- Score tracking
- Sound effects

---

## Alternative Name Suggestions

| Name                   | Description                                 |
| ---------------------- | ------------------------------------------- |
| **Fetch Frenzy**       | Emphasizes the fast-paced fetch gameplay    |
| **Wiener Toss**        | Playful nod to the dachshund breed nickname |
| **Long Boi Fetch**     | Internet-inspired, modern and fun           |
| **Sausage Dog Sprint** | Descriptive and charming                    |
| **Doxie Dash**         | Short for dachshund, catchy alliteration    |
| **Hot Dog Hustle**     | Fun wordplay on the breed's shape           |
| **The Fetch Express**  | Highlights the speedy retrieval gameplay    |
| **Bark & Ball**        | Simple, describes the core mechanic         |

### Top Recommendations:

1. **Fetch Frenzy** - Catchy, action-oriented, easy to remember
2. **Doxie Dash** - Maintains alliteration, breed-specific, short
3. **Wiener Toss** - Humorous, memorable, unique
